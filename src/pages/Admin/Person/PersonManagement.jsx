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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import personService from "../../../apis/Person/person";
import { Helmet } from "react-helmet";
import dayjs from "dayjs"; // Import dayjs for date handling
import customParseFormat from "dayjs/plugin/customParseFormat"; // Thêm plugin
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"; // Thêm plugin này
import isSameOrAfter from "dayjs/plugin/isSameOrAfter"; // Thêm plugin này

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

  // Fetch persons
  const fetchPersons = async () => {
    try {
      setLoading(true);
      const response = await personService.getAllPerson();
      if (response.success) {
        setPersons(response.data);
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

  useEffect(() => {
    fetchPersons();
  }, []);

  // Handle Modal
  const showModal = (person = null) => {
    setEditingPerson(person);
    if (person) {
      try {
        const formData = {
          ...person,
          birthday: person.birthday ? dayjs(person.birthday, "D/M/YYYY") : null,
        };
        form.setFieldsValue(formData);
      } catch (error) {
        console.error("Error parsing date:", error);
        notification.error({
          message: "Error",
          description: "Invalid date format",
        });
      }
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingPerson(null);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const formattedValues = {
        ...values,
        birthday: values.birthday ? values.birthday.format("D/M/YYYY") : null,
      };

      const response = editingPerson
        ? await personService.updatePerson(editingPerson.id, formattedValues)
        : await personService.createPerson(formattedValues);

      if (response.success) {
        notification.success({
          message: editingPerson
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message,
        });
        handleCancel();
        fetchPersons();
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
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
            fetchPersons();
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
      filteredValue: [searchText],
      onFilter: (value, record) => {
        return (
          String(record.name).toLowerCase().includes(value.toLowerCase()) ||
          String(record.description)
            .toLowerCase()
            .includes(value.toLowerCase()) ||
          String(record.job).toLowerCase().includes(value.toLowerCase())
        );
      },
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
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />

        <Modal
          title={editingPerson ? "Edit Person" : "Add Person"}
          open={isModalVisible}
          onCancel={handleCancel}
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
                    // Kiểm tra xem có phải là đối tượng dayjs hợp lệ không
                    if (!dayjs.isDayjs(value) || !value.isValid()) {
                      return Promise.reject(new Error("Invalid date"));
                    }
                    // Kiểm tra ngày có trong quá khứ không
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
              />
            </Form.Item>

            <Form.Item
              name="picture"
              label="Picture URL"
              rules={[{ required: true, message: "Please input picture URL!" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item className="mb-0">
              <div className="flex justify-end space-x-4">
                <Button onClick={handleCancel}>Cancel</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  className="bg-[#FF009F] hover:bg-[#D1007F]"
                >
                  {editingPerson ? "Update" : "Create"}
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
