import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import genreService from "../../../apis/Genre/genre";

const { TextArea } = Input;

function GenreManagement() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [form] = Form.useForm();
  const role = localStorage.getItem("role");
  const isAdmin = role === "ADMIN";

  // Fetch genres
  const fetchGenres = async () => {
    try {
      setLoading(true);
      const response = await genreService.getGenres();
      if (response.success) {
        setGenres(response.data);
      }
    } catch (error) {
      message.error(error.message || "Failed to load genres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      if (editingGenre) {
        const response = await genreService.updateGenre(
          editingGenre.id,
          values
        );
        if (response.success) {
          message.success("Genre updated successfully");
          setModalVisible(false);
          form.resetFields();
          fetchGenres();
        }
      } else {
        const response = await genreService.createGenre(values);
        if (response.success) {
          message.success("Genre added successfully");
          setModalVisible(false);
          form.resetFields();
          fetchGenres();
        }
      }
    } catch (error) {
      message.error(error.message || "Operation failed");
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const response = await genreService.deleteGenre(id);
      if (response.success) {
        message.success("Genre deleted successfully");
        setGenres((prevGenres) =>
          prevGenres.filter((genre) => genre.id !== id)
        );
      }
    } catch (error) {
      message.error(error.message || "Failed to delete genre");
      console.error("Delete error:", error);
    }
  };

  const columns = [
    {
      title: "Genre Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    ...(isAdmin
      ? [
          {
            title: "Actions",
            key: "action",
            width: 150,
            render: (_, record) => (
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingGenre(record);
                    form.setFieldsValue(record);
                    setModalVisible(true);
                  }}
                />
                <Popconfirm
                  title="Are you sure you want to delete?"
                  onConfirm={() => handleDelete(record.id)}
                >
                  <Button danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Genre Management</h1>
        {isAdmin && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingGenre(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Add Genre
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={genres}
        rowKey="id"
        loading={loading}
        className="bg-white"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} genres`,
        }}
      />

      <Modal
        title={editingGenre ? "Edit Genre" : "Add New Genre"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="name"
            label="Genre Name"
            rules={[{ required: true, message: "Please enter genre name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Space>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingGenre ? "Update" : "Add"}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default GenreManagement;
