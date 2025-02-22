import React, { useState, useEffect } from "react";
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  notification,
  Card,
  Tag,
} from "antd";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";

const { Option } = Select;

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);

  // Fetch subscriptions
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call
      const response = await fetch("/api/subscriptions");
      const data = await response.json();
      setSubscriptions(data);
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to fetch subscriptions",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Handle form submit
  const handleSubmit = async (values) => {
    try {
      // TODO: Implement API call
      if (editingId) {
        // Update
        await fetch(`/api/subscriptions/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(values),
        });
      } else {
        // Create
        await fetch("/api/subscriptions", {
          method: "POST",
          body: JSON.stringify(values),
        });
      }

      notification.success({
        message: editingId ? "Updated Successfully" : "Created Successfully",
      });
      setIsModalVisible(false);
      form.resetFields();
      fetchSubscriptions();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    }
  };

  // Handle edit button click
  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      // TODO: Implement API call
      await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
      });
      notification.success({
        message: "Deleted Successfully",
      });
      fetchSubscriptions();
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.message,
      });
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Duration (months)",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price) => `$${price}`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "green" : "red"}>{status}</Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Card>
        <div className="flex justify-between mb-4">
          <h1 className="text-2xl font-bold">Subscription Packages</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setIsModalVisible(true);
            }}
          >
            Add Package
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={subscriptions}
          loading={loading}
          rowKey="id"
        />

        <Modal
          title={editingId ? "Edit Package" : "Add Package"}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          footer={null}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              name="name"
              label="Package Name"
              rules={[
                { required: true, message: "Please input package name!" },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="duration"
              label="Duration (months)"
              rules={[{ required: true, message: "Please input duration!" }]}
            >
              <Input type="number" min={1} />
            </Form.Item>

            <Form.Item
              name="price"
              label="Price"
              rules={[{ required: true, message: "Please input price!" }]}
            >
              <Input type="number" min={0} step={0.01} prefix="$" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true, message: "Please select status!" }]}
            >
              <Select>
                <Option value="Active">Active</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingId ? "Update" : "Create"}
                </Button>
                <Button
                  onClick={() => {
                    setIsModalVisible(false);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
