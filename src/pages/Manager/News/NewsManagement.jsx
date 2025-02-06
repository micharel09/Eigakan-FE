import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Option } = Select;
const { TextArea } = Input;

const NewsManagement = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  const dummyData = [
    {
      id: 1,
      title: "Top 10 Movies of 2024",
      category: "Reviews",
      author: "John Doe",
      date: "2024-03-20",
      status: "Published",
    },
    {
      id: 2,
      title: "The Evolution of Cinema Technology",
      category: "Film News",
      author: "Jane Smith",
      date: "2024-03-19",
      status: "Draft",
    },
    // Add more dummy data as needed
  ];

  const columns = [
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      filters: [
        { text: "Reviews", value: "Reviews" },
        { text: "Film News", value: "Film News" },
        { text: "Industry Updates", value: "Industry Updates" },
      ],
      onFilter: (value, record) => record.category === value,
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "Published"
              ? "bg-green-100 text-green-800"
              : "bg-yellow-100 text-yellow-800"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this news article?",
      content: "This action cannot be undone.",
      okText: "Yes",
      okType: "danger",
      cancelText: "No",
      onOk() {
        message.success("News article deleted successfully");
      },
    });
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        form.resetFields();
        setIsModalVisible(false);
        message.success(
          `News article ${editingId ? "updated" : "created"} successfully`
        );
        setEditingId(null);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News Management</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingId(null);
            form.resetFields();
            setIsModalVisible(true);
          }}
        >
          Add News
        </Button>
      </div>

      <Table columns={columns} dataSource={dummyData} rowKey="id" />

      <Modal
        title={editingId ? "Edit News" : "Add News"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        width={800}
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: "Please input the title!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: "Please select the category!" }]}
          >
            <Select>
              <Option value="Reviews">Reviews</Option>
              <Option value="Film News">Film News</Option>
              <Option value="Industry Updates">Industry Updates</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="content"
            label="Content"
            rules={[{ required: true, message: "Please input the content!" }]}
          >
            <TextArea rows={6} />
          </Form.Item>

          <Form.Item name="thumbnail" label="Thumbnail">
            <Upload
              listType="picture-card"
              maxCount={1}
              beforeUpload={() => false}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select the status!" }]}
          >
            <Select>
              <Option value="Published">Published</Option>
              <Option value="Draft">Draft</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NewsManagement;
