import React, { useState } from "react";
import { Table, Button, Switch, Space, Modal, Form, Input, Select } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";

const Subscription = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingPlan, setEditingPlan] = useState(null);

  const dummyData = [
    {
      id: 1,
      planName: "Basic Plan",
      duration: "7 Day(s)",
      price: "$ 10.00",
      deviceLimit: 1,
      ads: "ON",
      status: "Active",
    },
    {
      id: 2,
      planName: "Premium Plan",
      duration: "1 Month(s)",
      price: "$ 29.99",
      deviceLimit: 1,
      ads: "ON",
      status: "Active",
    },
    // ... more dummy data
  ];

  const columns = [
    {
      title: "Plan Name",
      dataIndex: "planName",
      key: "planName",
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
    },
    {
      title: "Device Limit",
      dataIndex: "deviceLimit",
      key: "deviceLimit",
    },
    {
      title: "Ads",
      dataIndex: "ads",
      key: "ads",
      render: (ads) => (
        <Switch
          checkedChildren="ON"
          unCheckedChildren="OFF"
          checked={ads === "ON"}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: "15%",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "Active"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            className="bg-blue-500"
          />
          <Button
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingPlan(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPlan(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (record) => {
    // Add delete logic here
    console.log("Delete", record);
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        if (editingPlan) {
          // Update existing plan
          console.log("Update plan", values);
        } else {
          // Add new plan
          console.log("Add new plan", values);
        }
        setIsModalVisible(false);
      })
      .catch((info) => {
        console.log("Validate Failed:", info);
      });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <Button type="primary" onClick={handleAdd} className="bg-blue-500">
          Add Plan
        </Button>
      </div>

      <Table columns={columns} dataSource={dummyData} rowKey="id" />

      <Modal
        title={editingPlan ? "Edit Plan" : "Add New Plan"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ ads: "ON", status: "Active" }}
        >
          <Form.Item
            name="planName"
            label="Plan Name"
            rules={[{ required: true, message: "Please input plan name!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="duration"
            label="Duration"
            rules={[{ required: true, message: "Please input duration!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="price"
            label="Price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <Input prefix="$" />
          </Form.Item>

          <Form.Item
            name="deviceLimit"
            label="Device Limit"
            rules={[{ required: true, message: "Please input device limit!" }]}
          >
            <Input type="number" />
          </Form.Item>

          <Form.Item name="ads" label="Ads">
            <Select>
              <Select.Option value="ON">ON</Select.Option>
              <Select.Option value="OFF">OFF</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" label="Status">
            <Select>
              <Select.Option value="Active">Active</Select.Option>
              <Select.Option value="Inactive">Inactive</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Subscription;
