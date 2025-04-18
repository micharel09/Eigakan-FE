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
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import axios from "axios";

// Extend dayjs với các plugins
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
    total: 0,
  });

  // Fetch data
  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const response = await personService.getAllPerson(page, 5, searchText);
      if (response.success) {
        setPersons(response.data);
        setPagination({
          ...pagination,
          current: page,
          total: response.total || 0,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not fetch persons",
      });
    } finally {
      setLoading(false);
    }
  };

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Initial load
  useEffect(() => {
    fetchData(1);
    return () => abortController?.abort();
  }, []);

  // Modal functions
  const showModal = (person = null) => {
    setEditingPerson(person);
    if (person) {
      const birthdayAsDayjs = person.birthday
        ? dayjs(person.birthday, ["DD/MM/YYYY", "YYYY-MM-DD"])
        : null;
      form.setFieldsValue({
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
      });
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    abortController?.abort();
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

      const response = editingPerson
        ? await personService.updatePerson(editingPerson.id, formData)
        : await personService.createPerson(formData);

      if (response.success) {
        notification.success({
          message: editingPerson
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message,
        });
        handleCancel();
        fetchData(pagination.current);
      }
    } catch (error) {
      notification.error({ message: "Error", description: error.message });
    }
  };

  // Handle delete
  const handleDelete = (id) => {
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
          fetchData(pagination.current);
        }
      },
    });
  };

  // Handle upload
  const handleUpload = async ({ file, onSuccess, onError }) => {
    setIsUploading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      if (!file) throw new Error("No file selected");
      const response = await personService.uploadImage(file, controller.signal);

      if (!response || !isModalVisible) {
        setIsUploading(false);
        return;
      }

      if (response?.data?.status) {
        // Tạo đối tượng file với thông tin xem trước
        const uploadedFile = {
          uid: file.uid,
          name: file.name,
          status: "done",
          url: response.data.data[0].url,
          thumbUrl: response.data.data[0].url,
        };

        form.setFieldsValue({
          image: [uploadedFile],
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

  // Table columns
  const columns = [
    {
      title: "Picture",
      dataIndex: "picture",
      key: "picture",
      width: 100,
      render: (pic) => (
        <img
          src={pic}
          alt="Person"
          className="w-12 h-12 rounded-full object-cover"
        />
      ),
    },
    { title: "Name", dataIndex: "name", key: "name" },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      width: 300,
    },
    { title: "Job", dataIndex: "job", key: "job" },
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
      render: (bday) => bday || "-",
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
            pageSize: 5,
            onChange: (page) => fetchData(page),
          }}
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
            initialValues={{ gender: true }}
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
                    if (!value) return Promise.resolve();
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
              getValueFromEvent={(e) => e?.fileList}
              rules={[{ required: true, message: "Please upload an image!" }]}
            >
              <div className="flex flex-col space-y-2">
                <Upload
                  customRequest={handleUpload}
                  listType="picture-card"
                  showUploadList={false}
                  accept="image/*"
                  maxCount={1}
                  fileList={form.getFieldValue("image") || []}
                  onRemove={() => {
                    form.setFieldsValue({ image: [], picture: null });
                  }}
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
                  <div className="flex items-center justify-center w-full h-24 cursor-pointer hover:bg-gray-50 transition-colors">
                    <PlusOutlined className="text-lg" />
                    <div className="ml-2">Upload</div>
                  </div>
                </Upload>

                {/* Hiển thị hình ảnh đã tải lên */}
                {form.getFieldValue("image")?.[0]?.url && (
                  <div className="relative mt-4 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img
                      src={form.getFieldValue("image")?.[0]?.url}
                      alt="Preview"
                      className="w-full h-auto max-h-64 object-contain bg-gray-50"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white shadow-sm"
                      onClick={() =>
                        form.setFieldsValue({ image: [], picture: null })
                      }
                    />
                  </div>
                )}
              </div>
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
