import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Card,
  Tooltip,
  Typography,
  notification,
  DatePicker,
  Select,
  Upload,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import personService from "../../../apis/Person/person";
import NewsApi from "../../../apis/News/news";
import { Helmet } from "react-helmet";
import dayjs from "dayjs"; // Import dayjs for date handling
import customParseFormat from "dayjs/plugin/customParseFormat"; // Thêm plugin
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"; // Thêm plugin này
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // Thêm plugin này
import axios from "axios";

// Extend dayjs với các plugins cần thiết
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Title, Text } = Typography;

const PersonManagement = () => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [abortController, setAbortController] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    hasNextPage: true,
  });
  const [allPersons, setAllPersons] = useState([]);

  // Fetch persons
  const fetchPersons = async (page = 1, pageSize = 5) => {
    try {
      setLoading(true);
      const response = await personService.getAllPerson(page, pageSize);
      if (response.success) {
        setPersons(response.data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          hasNextPage: response.data.length === pageSize,
        }));
      }
    } catch (error) {
      notification.error({
        message: "Lỗi",
        description: error.message || "Không thể lấy danh sách người",
      });
    } finally {
      setLoading(false);
    }
  };

  // Thêm hàm mới để fetch tất cả persons cho search
  const fetchAllPersons = async () => {
    try {
      const response = await axios.get(
        "https://eigakan2222-001-site1.jtempurl.com/api/Person?pageNumber=0&pageSize=1000"
      );
      if (response.data.success) {
        setAllPersons(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching all persons:", error);
    }
  };

  // Thêm useEffect để fetch dữ liệu khi component mount
  useEffect(() => {
    fetchAllPersons();
  }, []);

  // Sửa lại phần xử lý search
  useEffect(() => {
    if (searchText) {
      const filteredResults = allPersons.filter(
        (person) =>
          person.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          person.description
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          person.job?.toLowerCase().includes(searchText.toLowerCase())
      );
      setPersons(filteredResults);
    } else {
      // Nếu không có search text, quay lại hiển thị dữ liệu phân trang bình thường
      fetchPersons(pagination.current, pagination.pageSize);
    }
  }, [searchText]);

  // Hàm hủy upload hiện tại
  const cancelCurrentUpload = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      cancelCurrentUpload();
    };
  }, []);

  // Handle Modal
  const showModal = (person = null) => {
    setEditingPerson(person);
    if (person) {
      try {
        // Kiểm tra và parse ngày tháng cẩn thận hơn
        let birthdayAsDayjs = null;
        if (person.birthday) {
          // Thử parse với nhiều format khác nhau
          const formats = ["DD/MM/YYYY", "D/M/YYYY", "YYYY-MM-DD"];
          for (let format of formats) {
            const parsed = dayjs(person.birthday, format);
            if (parsed.isValid()) {
              birthdayAsDayjs = parsed;
              break;
            }
          }
          // Nếu không parse được, log lỗi
          if (!birthdayAsDayjs) {
            console.error("Could not parse date:", person.birthday);
          }
        }

        const formData = {
          ...person,
          birthday: birthdayAsDayjs,
          image: person.picture
            ? [
                {
                  uid: "-1",
                  name: "image.png",
                  status: "done",
                  url: person.picture,
                },
              ]
            : [],
        };
        form.setFieldsValue(formData);
      } catch (error) {
        console.error("Error setting form values:", error);
        notification.error({
          message: "Error",
          description: "Could not load person data",
        });
      }
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    cancelCurrentUpload();
    setIsUploading(false);
    form.resetFields();
    setIsModalVisible(false);
    setEditingPerson(null);
  };

  const handleSubmit = async (values) => {
    try {
      const formData = {
        ...values,
        birthday: values.birthday?.format("DD/MM/YYYY") || null,
        picture: values.picture || form.getFieldValue("picture"),
      };

      let response;
      if (editingPerson) {
        response = await personService.updatePerson(editingPerson.id, formData);
      } else {
        response = await personService.createPerson(formData);
      }

      if (response.success) {
        notification.success({
          message: editingPerson
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message,
        });
        handleCancel();
        fetchPersons(pagination.current, pagination.pageSize);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      Modal.confirm({
        title: "Are you sure you want to delete this person?",
        content: "This action cannot be undone",
        okText: "Yes",
        okType: "danger",
        cancelText: "No",
        onOk: async () => {
          const response = await personService.deletePerson(id);
          if (response.success) {
            notification.success({
              message: "Deleted Successfully",
              description: response.message,
            });
            fetchPersons(pagination.current, pagination.pageSize);
          }
        },
      });
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    }
  };

  // Thêm hàm xử lý upload ảnh
  const handleUpload = async (options) => {
    const { file, onSuccess, onError } = options;
    setIsUploading(true);

    // Tạo AbortController mới cho request này
    const controller = new AbortController();
    setAbortController(controller);

    try {
      if (!file) throw new Error("No file selected");

      const response = await personService.uploadImage(file, controller.signal);

      // Nếu request đã bị hủy hoặc modal đã đóng
      if (!response || !isModalVisible) {
        setIsUploading(false);
        return;
      }

      if (response?.data?.status) {
        form.setFieldsValue({
          image: [file],
          picture: response.data.data[0].url,
        });

        notification.success({
          message: "Upload Successful",
          description: "Image has been uploaded successfully",
        });
        onSuccess(response.data);
      } else {
        throw new Error(response?.data?.message || "Upload failed");
      }
    } catch (error) {
      // Chỉ hiện thông báo lỗi nếu không phải do hủy request
      if (!axios.isCancel(error)) {
        onError(error);
        notification.error({
          message: "Upload Failed",
          description: error.message || "Failed to upload image",
        });
      }
    } finally {
      setIsUploading(false);
      setAbortController(null);
    }
  };

  const columns = [
    {
      title: "Picture",
      dataIndex: "picture",
      key: "picture",
      width: 100,
      render: (picture) => (
        <img
          src={picture}
          alt="Person"
          className="w-12 h-12 rounded-full object-cover"
        />
      ),
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 300,
    },
    {
      title: "Job",
      dataIndex: "job",
      key: "job",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      render: (gender) => (gender ? "Male" : "Female"),
    },
    {
      title: "Birthday",
      dataIndex: "birthday",
      key: "birthday",
      render: (birthday) => birthday || "-", // Just display the birthday string as is
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      fixed: "right",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          />
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  // Thêm hàm xử lý thay đổi trang
  const handleTableChange = (newPagination, filters, sorter) => {
    fetchPersons(newPagination.current, newPagination.pageSize);
  };

  return (
    <div className="p-6">
      <Helmet>
        <title>Person Management - Admin</title>
      </Helmet>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={4}>Person Management</Title>
            <Text type="secondary">Manage all your persons in one place</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-[#FF009F] hover:bg-[#D1007F]"
          >
            Add Person
          </Button>
        </div>

        <div className="mb-4">
          <Input
            placeholder="Search persons..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Table
          columns={columns}
          dataSource={persons}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            pageSizeOptions: ["5", "10", "20", "50"],
            defaultPageSize: 5,
            showTotal: (total, range) => `Trang ${pagination.current}`,
            itemRender: (page, type, originalElement) => {
              const current = pagination.current;
              if (type === "page") {
                if (
                  page === current ||
                  page === current - 1 ||
                  page === current + 1
                ) {
                  return (
                    <Button type={current === page ? "primary" : "default"}>
                      {page}
                    </Button>
                  );
                }
                return null;
              }
              return originalElement;
            },
            showLessItems: true,
            showQuickJumper: false,
            total: pagination.hasNextPage
              ? (pagination.current + 1) * pagination.pageSize
              : pagination.current * pagination.pageSize,
          }}
          onChange={(newPagination, filters, sorter) =>
            fetchPersons(newPagination.current, newPagination.pageSize)
          }
        />

        <Modal
          title={editingPerson ? "Edit Person" : "Add Person"}
          open={isModalVisible}
          onCancel={handleCancel}
          maskClosable={true}
          closable={true}
          footer={null}
          width={600}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              gender: true, // Set default value for gender
            }}
          >
            <Form.Item
              name="name"
              label="Name"
              rules={[{ required: true, message: "Please input person name!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: "Please input description!" }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>

            <Form.Item
              name="job"
              label="Job"
              rules={[{ required: true, message: "Please input person job!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: "Please select gender!" }]}
            >
              <Select>
                <Select.Option value={true}>Male</Select.Option>
                <Select.Option value={false}>Female</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="birthday"
              label="Birthday"
              rules={[
                { required: true, message: "Please select birthday!" },
                {
                  validator: (_, value) => {
                    if (!value) {
                      return Promise.resolve();
                    }
                    if (!dayjs.isDayjs(value) || !value.isValid()) {
                      return Promise.reject(new Error("Invalid date"));
                    }
                    if (value.isAfter(dayjs())) {
                      return Promise.reject(
                        new Error("Birthday must be in the past")
                      );
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="Select birthday"
                disabledDate={(current) => current && current.isAfter(dayjs())}
                showToday={false}
                allowClear={true}
              />
            </Form.Item>

            <Form.Item
              name="image"
              label="Image"
              valuePropName="fileList"
              getValueFromEvent={(e) => {
                return e?.fileList;
              }}
              rules={[{ required: true, message: "Please upload an image!" }]}
            >
              <Upload
                customRequest={handleUpload}
                showUploadList={true}
                accept="image/*"
                maxCount={1}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith("image/");
                  const isLt2M = file.size / 1024 / 1024 < 2;

                  if (!isImage) {
                    notification.error({
                      message: "Upload Failed",
                      description: "You can only upload image files!",
                    });
                    return false;
                  }

                  if (!isLt2M) {
                    notification.error({
                      message: "Upload Failed",
                      description: "Image must be smaller than 2MB!",
                    });
                    return false;
                  }

                  return true;
                }}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Form.Item>

            <Form.Item className="mb-0">
              <div className="flex justify-end space-x-4">
                <Button onClick={handleCancel} disabled={isUploading}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={isUploading}
                  className="bg-[#FF009F] hover:bg-[#D1007F]"
                >
                  {isUploading
                    ? "Uploading..."
                    : editingPerson
                    ? "Update"
                    : "Create"}
                </Button>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default PersonManagement;
