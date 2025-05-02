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
import axios from "axios";

const { Title, Text } = Typography;

const GenreManagement = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [allGenres, setAllGenres] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 8,
    total: 0,
  });

  // Fetch genres
  const fetchGenres = async (page = 1, pageSize = 8) => {
    try {
      setLoading(true);
      const response = await genreService.getGenres(page, pageSize);
      if (response.success) {
        setGenres(response.data);
        setPagination((prev) => ({
          ...prev,
          current: page,
          pageSize: pageSize,
          total: response.total || 0,
        }));
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

  // Fetch all genres for search
  const fetchAllGenres = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "https://eigakan-001-site1.ktempurl.com/api/Genre?page=0&pageSize=1000",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data && response.data.success) {
        setAllGenres(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching all genres:", error);
    }
  };

  useEffect(() => {
    fetchGenres(pagination.current, pagination.pageSize);
    fetchAllGenres();
  }, []);

  // Filter genres based on search
  useEffect(() => {
    if (searchText) {
      const filteredResults = allGenres.filter((genre) =>
        genre.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setGenres(filteredResults);
      setPagination((prev) => ({
        ...prev,
        current: 1,
        total: filteredResults.length,
      }));
    } else {
      fetchGenres(pagination.current, pagination.pageSize);
    }
  }, [searchText]);

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

  // Handle table change
  const handleTableChange = (newPagination) => {
    if (!searchText) {
      fetchGenres(newPagination.current, newPagination.pageSize);
      setPagination(newPagination);
    } else {
      setPagination(newPagination);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Text className="">{text}</Text>,
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
          dataSource={genres}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
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
