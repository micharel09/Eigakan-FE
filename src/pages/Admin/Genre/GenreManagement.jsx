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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import genreService from "../../../apis/Genre/genre";

const { Title, Text } = Typography;

const GenreManagement = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");

  // Fetch genres
  const fetchGenres = async () => {
    try {
      setLoading(true);
      const response = await genreService.getGenres();
      if (response.success) {
        setGenres(response.data);
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not fetch genres",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  // Handle Modal
  const showModal = (genre = null) => {
    setEditingGenre(genre);
    form.setFieldsValue(genre || {});
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingGenre(null);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingGenre) {
        // Update genre
        await genreService.updateGenre(editingGenre.id, values);
        notification.success({ message: "Genre updated successfully" });
      } else {
        // Create new genre
        await genreService.createGenre(values);
        notification.success({ message: "Genre created successfully" });
      }
      handleCancel();
      fetchGenres();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Operation failed",
      });
    }
  };

  // Handle Delete
  const handleDelete = async (id) => {
    try {
      await genreService.deleteGenre(id);
      notification.success({ message: "Genre deleted successfully" });
      fetchGenres();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message || "Could not delete genre",
      });
    }
  };

  // Filter genres based on search
  const filteredGenres = genres.filter((genre) =>
    genre.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => (
        <Text className="line-clamp-2" title={text}>
          {text}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "action",
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => showModal(record)}
              className="hover:text-[#FF009F]"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              className="hover:text-gray-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={4} className="!mb-0">
              Genre Management
            </Title>
            <Text type="secondary">Manage all your genres in one place</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
            style={{
              backgroundColor: "#FF009F",
            }}
          >
            Add Genre
          </Button>
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <Input
            placeholder="Search genres..."
            prefix={<SearchOutlined />}
            onChange={(e) => setSearchText(e.target.value)}
            className="max-w-xs focus:border-[#FF009F] hover:border-[#FF009F]"
          />
        </div>

        {/* Genre Table */}
        <Table
          columns={columns}
          dataSource={filteredGenres}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingGenre ? "Edit Genre" : "Add New Genre"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={editingGenre}
        >
          <Form.Item
            name="name"
            label="Genre Name"
            rules={[{ required: true, message: "Please input genre name!" }]}
          >
            <Input className="focus:border-[#FF009F] hover:border-[#FF009F]" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please input description!" }]}
          >
            <Input.TextArea
              rows={4}
              className="focus:border-[#FF009F] hover:border-[#FF009F]"
            />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-[#FF009F] hover:bg-[#D1007F] border-none"
              style={{
                backgroundColor: "#FF009F",
              }}
            >
              {editingGenre ? "Update" : "Create"}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default GenreManagement;
