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
  Tooltip,
  Typography,
  InputNumber,
  DatePicker,
  Tag,
  Tabs,
  TimePicker,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  ScheduleOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import adSlotService from "../../../apis/AdSlot/adslot";

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const STATUS_MAP = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  DELETED: "Deleted",
};

const AdSlotTimeManagement = () => {
  const [adSlotTimes, setAdSlotTimes] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [adSlotTimeRanges, setAdSlotTimeRanges] = useState([]);
  const [filteredRanges, setFilteredRanges] = useState([]);
  const [isRangeModalVisible, setIsRangeModalVisible] = useState(false);
  const [rangeForm] = Form.useForm();
  const [editingRangeId, setEditingRangeId] = useState(null);
  const [searchRangeText, setSearchRangeText] = useState("");
  const [rangeStatusFilter, setRangeStatusFilter] = useState(null);
  const [rangePagination, setRangePagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [activeTab, setActiveTab] = useState("1");
  const [adSlots, setAdSlots] = useState([]);
  const [filteredSlots, setFilteredSlots] = useState([]);
  const [isSlotModalVisible, setIsSlotModalVisible] = useState(false);
  const [slotForm] = Form.useForm();
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [searchSlotText, setSearchSlotText] = useState("");
  const [slotStatusFilter, setSlotStatusFilter] = useState(null);
  const [slotPagination, setSlotPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchAdSlotTimes = async () => {
    setLoading(true);
    try {
      const response = await adSlotService.getAllAdSlotTimes();

      if (response.success) {
        setAdSlotTimes(response.data);
        setFilteredData(response.data);
        setPagination({
          ...pagination,
          total: response.data.length,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to fetch data",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSlotTimeRanges = async () => {
    setLoading(true);
    try {
      const response = await adSlotService.getAllAdSlotTimeRanges();

      if (response.success) {
        setAdSlotTimeRanges(response.data);
        setFilteredRanges(response.data);
        setRangePagination({
          ...rangePagination,
          total: response.data.length,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to fetch ranges",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAdSlots = async () => {
    setLoading(true);
    try {
      const response = await adSlotService.getAllAdSlots();

      if (response.success) {
        console.log("Fetched ad slots:", response.data);
        setAdSlots(response.data);
        setFilteredSlots(response.data);
        setSlotPagination({
          ...slotPagination,
          total: response.data.length,
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to fetch slots",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdSlotTimes();
    fetchAdSlotTimeRanges();
    fetchAdSlots();
  }, []);

  const handleSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      let response;
      if (editingId) {
        response = await adSlotService.updateAdSlot(editingId, values);
      } else {
        const createData = {
          adSlotTimeRangeID: values.adSlotTimeRangeID,
          adSlotID: values.adSlotID,
        };
        response = await adSlotService.createAdSlotTime(createData);
      }

      if (response.success) {
        notification.success({
          message: editingId ? "Updated Successfully" : "Created Successfully",
          description: response.message || "Operation completed successfully",
        });
        setIsModalVisible(false);
        form.resetFields();
        fetchAdSlotTimes();
      } else {
        notification.error({
          message: "Operation Failed",
          description: response.message || "Something went wrong",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to submit",
      });
    }
  };

  const handleRangeSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const formattedData = {
        startTime: values.startTime.format("HH:mm"),
        endTime: values.endTime.format("HH:mm"),
        slotTimeRangePrice: values.slotTimeRangePrice,
      };

      let response;
      if (editingRangeId) {
        response = await adSlotService.updateAdSlotTimeRange(
          editingRangeId,
          formattedData
        );
      } else {
        response = await adSlotService.createAdSlotTimeRange(formattedData);
      }

      if (response.success) {
        notification.success({
          message: editingRangeId
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message || "Operation completed successfully",
        });
        setIsRangeModalVisible(false);
        rangeForm.resetFields();
        fetchAdSlotTimeRanges();
      } else {
        notification.error({
          message: "Operation Failed",
          description: response.message || "Something went wrong",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to submit",
      });
    }
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this slot time?",
      content: "This action cannot be undone",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await adSlotService.deleteAdSlotTime(id);

          if (response.success) {
            notification.success({
              message: "Deleted Successfully",
              description: response.message || "Successfully deleted the item",
            });
            fetchAdSlotTimes();
          } else {
            notification.error({
              message: "Delete Failed",
              description: response.message || "Failed to delete the item",
            });
          }
        } catch (error) {
          notification.error({
            message: "Delete Failed",
            description: error.response?.data?.message || "Failed to delete",
          });
        }
      },
    });
  };

  const handleRangeDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this time range?",
      content: "This action cannot be undone",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await adSlotService.deleteAdSlotTimeRange(id);

          if (response.success) {
            notification.success({
              message: "Deleted Successfully",
              description:
                response.message || "Successfully deleted the time range",
            });
            fetchAdSlotTimeRanges();
          } else {
            notification.error({
              message: "Delete Failed",
              description:
                response.message || "Failed to delete the time range",
            });
          }
        } catch (error) {
          notification.error({
            message: "Delete Failed",
            description: error.response?.data?.message || "Failed to delete",
          });
        }
      },
    });
  };

  const handleSlotDelete = (id) => {
    Modal.confirm({
      title: "Are you sure you want to delete this slot location?",
      content: "This action cannot be undone",
      okText: "Yes, delete it",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        try {
          const response = await adSlotService.deleteAdSlot(id);

          if (response.success) {
            notification.success({
              message: "Deleted Successfully",
              description:
                response.message || "Successfully deleted the slot location",
            });
            fetchAdSlots();
          } else {
            notification.error({
              message: "Delete Failed",
              description:
                response.message || "Failed to delete the slot location",
            });
          }
        } catch (error) {
          notification.error({
            message: "Delete Failed",
            description: error.response?.data?.message || "Failed to delete",
          });
        }
      },
    });
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleEdit = (record) => {
    setEditingId(record.id);
    form.setFieldsValue({
      slotTimePrice: record.slotTimePrice,
      status: record.status,
      adSlotTimeRangeID: record.adSlotTimeRangeID,
      adSlotID: record.adSlotID,
      isSelected: record.isSelected,
    });
    setIsModalVisible(true);
  };

  const handleRangeEdit = (record) => {
    setEditingRangeId(record.id);

    rangeForm.setFieldsValue({
      startTime: dayjs(record.startTime, "HH:mm:ss"),
      endTime: dayjs(record.endTime, "HH:mm:ss"),
      slotTimeRangePrice: record.slotTimeRangePrice,
    });

    setIsRangeModalVisible(true);
  };

  useEffect(() => {
    let result = [...adSlotTimes];

    if (searchText) {
      result = result.filter((item) =>
        item.adSlotTimeRange?.startTime
          .toLowerCase()
          .includes(searchText.toLowerCase())
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredData(result);
  }, [adSlotTimes, searchText, statusFilter]);

  useEffect(() => {
    let result = [...adSlotTimeRanges];

    if (searchRangeText) {
      result = result.filter(
        (item) =>
          item.startTime
            .toLowerCase()
            .includes(searchRangeText.toLowerCase()) ||
          item.endTime.toLowerCase().includes(searchRangeText.toLowerCase())
      );
    }

    if (rangeStatusFilter) {
      result = result.filter((item) => item.status === rangeStatusFilter);
    }

    setFilteredRanges(result);
  }, [adSlotTimeRanges, searchRangeText, rangeStatusFilter]);

  const handleSlotSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const formattedData = {
        slotLocation: values.slotLocation,
        slotPrice: values.slotPrice,
      };

      let response;
      if (editingSlotId) {
        response = await adSlotService.updateAdSlot(
          editingSlotId,
          formattedData
        );
      } else {
        response = await adSlotService.createAdSlot(formattedData);
      }

      if (response.success) {
        notification.success({
          message: editingSlotId
            ? "Updated Successfully"
            : "Created Successfully",
          description: response.message || "Operation completed successfully",
        });
        setIsSlotModalVisible(false);
        slotForm.resetFields();
        fetchAdSlots();
      } else {
        notification.error({
          message: "Operation Failed",
          description: response.message || "Something went wrong",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: error.response?.data?.message || "Failed to submit",
      });
    }
  };

  const handleSlotEdit = (record) => {
    setEditingSlotId(record.id);
    slotForm.setFieldsValue({
      slotLocation: record.slotLocation,
      slotPrice: record.slotPrice,
    });
    setIsSlotModalVisible(true);
  };

  useEffect(() => {
    if (!adSlots) return;

    let result = [...adSlots];

    if (searchSlotText) {
      result = result.filter((item) =>
        item.slotLocation.toLowerCase().includes(searchSlotText.toLowerCase())
      );
    }

    if (slotStatusFilter) {
      result = result.filter((item) => item.status === slotStatusFilter);
    }

    setFilteredSlots(result);
  }, [searchSlotText, slotStatusFilter, adSlots]);

  const columns = [
    {
      title: "Slot Location",
      dataIndex: "adSlot",
      key: "adSlot",
      render: (adSlot) => adSlot?.slotLocation || "N/A",
    },
    {
      title: "Time Range",
      key: "timeRange",
      render: (_, record) => (
        <div>
          <Text strong>
            {record.adSlotTimeRange?.startTime} -{" "}
            {record.adSlotTimeRange?.endTime}
          </Text>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "slotTimePrice",
      key: "slotTimePrice",
      render: (price) => formatVND(price),
    },
    {
      title: "Selected",
      dataIndex: "isSelected",
      key: "isSelected",
      render: (isSelected) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            isSelected
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-gray-100 text-gray-500 border border-gray-500"
          }`}
        >
          {isSelected ? "Selected" : "Not Selected"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="hover:text-blue-500"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              className="hover:text-red-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const rangeColumns = [
    {
      title: "Time Range",
      key: "timeRange",
      render: (_, record) => (
        <div>
          <Text strong>
            {record.startTime} - {record.endTime}
          </Text>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "slotTimeRangePrice",
      key: "slotTimeRangePrice",
      render: (price) => formatVND(price),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleRangeEdit(record)}
              className="hover:text-blue-500"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleRangeDelete(record.id)}
              className="hover:text-red-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const slotColumns = [
    {
      title: "Slot Location",
      dataIndex: "slotLocation",
      key: "slotLocation",
      render: (location) => (
        <Tag color="blue" className="text-xs font-medium px-3 py-1">
          {location}
        </Tag>
      ),
    },
    {
      title: "Price",
      dataIndex: "slotPrice",
      key: "slotPrice",
      render: (price) => formatVND(price),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <span
          className={`px-3 py-1 rounded-full text-xs ${
            status === "ACTIVE"
              ? "bg-green-100 text-green-500 border border-green-500"
              : "bg-red-100 text-red-500 border border-red-500"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createAt",
      key: "createAt",
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleSlotEdit(record)}
              className="hover:text-blue-500"
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleSlotDelete(record.id)}
              className="hover:text-red-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <Card className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <Title level={3} className="!mb-1">
              Ad Slot Time Management
            </Title>
            <Text type="secondary" className="text-sm">
              Manage all advertising slot times
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (activeTab === "1") {
                setEditingId(null);
                form.resetFields();
                setIsModalVisible(true);
              } else if (activeTab === "2") {
                setEditingRangeId(null);
                rangeForm.resetFields();
                setIsRangeModalVisible(true);
              } else if (activeTab === "3") {
                setEditingSlotId(null);
                slotForm.resetFields();
                setIsSlotModalVisible(true);
              }
            }}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {activeTab === "1"
              ? "Add Slot Time"
              : activeTab === "2"
              ? "Add Time Range"
              : "Add Slot Location"}
          </Button>
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="mb-4 bg-white p-1 rounded-lg shadow-sm"
      >
        <TabPane
          tab={
            <span>
              <ClockCircleOutlined /> Ad Slot Times
            </span>
          }
          key="1"
        >
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by time range..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="rounded-lg"
                allowClear
                onChange={(e) => setSearchText(e.target.value)}
              />
              <Select
                placeholder="Filter by status"
                className="w-full"
                allowClear
                onChange={(value) => setStatusFilter(value)}
                value={statusFilter}
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchText("");
                  setStatusFilter(null);
                }}
                className="md:w-fit md:ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card>
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="id"
              pagination={pagination}
              loading={loading}
              onChange={(newPagination) => setPagination(newPagination)}
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <ScheduleOutlined /> Time Ranges
            </span>
          }
          key="2"
        >
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by time..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="rounded-lg"
                allowClear
                onChange={(e) => setSearchRangeText(e.target.value)}
              />
              <Select
                placeholder="Filter by status"
                className="w-full"
                allowClear
                onChange={(value) => setRangeStatusFilter(value)}
                value={rangeStatusFilter}
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchRangeText("");
                  setRangeStatusFilter(null);
                }}
                className="md:w-fit md:ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card>
            <Table
              columns={rangeColumns}
              dataSource={filteredRanges}
              rowKey="id"
              pagination={rangePagination}
              loading={loading}
              onChange={(newPagination) => setRangePagination(newPagination)}
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <AppstoreOutlined /> Slot Locations
            </span>
          }
          key="3"
        >
          <Card className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Search by location..."
                prefix={<SearchOutlined className="text-gray-400" />}
                className="rounded-lg"
                allowClear
                onChange={(e) => setSearchSlotText(e.target.value)}
              />
              <Select
                placeholder="Filter by status"
                className="w-full"
                allowClear
                onChange={(value) => setSlotStatusFilter(value)}
                value={slotStatusFilter}
              >
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
              <Button
                icon={<FilterOutlined />}
                onClick={() => {
                  setSearchSlotText("");
                  setSlotStatusFilter(null);
                }}
                className="md:w-fit md:ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </Card>

          <Card>
            <Table
              columns={slotColumns}
              dataSource={filteredSlots}
              rowKey="id"
              pagination={slotPagination}
              loading={loading}
              onChange={(newPagination) => setSlotPagination(newPagination)}
              className="rounded-lg overflow-hidden"
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingId ? "Edit Slot Time" : "Add Slot Time"}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="adSlotTimeRangeID"
            label="Time Range"
            rules={[{ required: true, message: "Please select time range!" }]}
          >
            <Select placeholder="Select time range">
              {adSlotTimeRanges.map((range) => (
                <Option key={range.id} value={range.id}>
                  {range.startTime} - {range.endTime}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="adSlotID"
            label="Slot Location"
            rules={[
              { required: true, message: "Please select slot location!" },
            ]}
          >
            <Select placeholder="Select slot location">
              {adSlots.map((slot) => (
                <Option key={slot.id} value={slot.id}>
                  {slot.slotLocation}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
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

      <Modal
        title={editingRangeId ? "Edit Time Range" : "Add Time Range"}
        open={isRangeModalVisible}
        onCancel={() => {
          setIsRangeModalVisible(false);
          rangeForm.resetFields();
        }}
        footer={null}
      >
        <Form form={rangeForm} layout="vertical" onFinish={handleRangeSubmit}>
          <Form.Item
            name="startTime"
            label="Start Time"
            rules={[{ required: true, message: "Please select start time!" }]}
          >
            <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
          </Form.Item>

          <Form.Item
            name="endTime"
            label="End Time"
            rules={[{ required: true, message: "Please select end time!" }]}
          >
            <TimePicker className="w-full" format="HH:mm" minuteStep={15} />
          </Form.Item>

          <Form.Item
            name="slotTimeRangePrice"
            label="Price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              prefix="VND"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRangeId ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setIsRangeModalVisible(false);
                  rangeForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSlotId ? "Edit Slot Location" : "Add Slot Location"}
        open={isSlotModalVisible}
        onCancel={() => {
          setIsSlotModalVisible(false);
          slotForm.resetFields();
        }}
        footer={null}
      >
        <Form form={slotForm} layout="vertical" onFinish={handleSlotSubmit}>
          <Form.Item
            name="slotLocation"
            label="Slot Location"
            rules={[{ required: true, message: "Please input slot location!" }]}
          >
            <Input placeholder="e.g. SIDEBAR-LEFT, HEADER, FOOTER" />
          </Form.Item>

          <Form.Item
            name="slotPrice"
            label="Price"
            rules={[{ required: true, message: "Please input price!" }]}
          >
            <InputNumber
              className="w-full"
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              }
              parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
              prefix="VND"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingSlotId ? "Update" : "Create"}
              </Button>
              <Button
                onClick={() => {
                  setIsSlotModalVisible(false);
                  slotForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdSlotTimeManagement;
