import React, { useEffect, useState } from 'react';
import { Button, Form, Input, DatePicker, Select, Upload, Spin } from 'antd';
import { StarOutlined, UploadOutlined } from '@ant-design/icons';
import UserApi from '../../apis/User/user';
import dayjs from 'dayjs';

const { Option } = Select;

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 },
};

const validateMessages = {
  required: '${label} is required!',
  types: { email: '${label} is not a valid email!', number: '${label} is not a valid number!' },
  number: { range: '${label} must be between ${min} and ${max}' },
};

// Xử lý khi submit
const onFinish = (values) => {
    const formattedData = {
      ...values,
      gender: values.gender === "true" ? true : values.gender === "false" ? false : null,
      JoinDate: values.JoinDate ? dayjs(values.JoinDate).format('YYYY-MM-DDTHH:mm:ss.SSSSSSS') : null, // Định dạng ngày
    };
  
    console.log("Formatted Data:", formattedData);
  };

const DetailsProfile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Hàm lấy dữ liệu từ API
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const profileResponse = await UserApi.GetUserProfile();
      console.log('profileResponse:', profileResponse);
      const profileData = profileResponse.data;

      // Cập nhật dữ liệu vào form
      form.setFieldsValue({
        user: {
          name: profileData.fullName,
          email: profileData.email,
          'Join Date': profileData.createDate ? dayjs(profileData.createDate) : null,
          Status: profileData.status,
        },
        gender: profileData.gender !== null ? String(profileData.gender) : null, // Chuyển boolean thành string
        Birthday: profileData.birthday ? dayjs(profileData.birthday) : null, // Định dạng ngày
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <Spin spinning={loading}>
      <Form
        {...layout}
        form={form}
        name="nest-messages"
        style={{ marginLeft: 100, maxWidth: 600 }}
        validateMessages={validateMessages}
      >
        <div className="flex gap-x-40">
          <div>
            <Form.Item name={['user', 'name']} label="Name" rules={[{ required: true }]}>
              <Input style={{ width: '200%' }} />
            </Form.Item>
            <Form.Item name={['user', 'email']} label="Email" rules={[{ type: 'email' }]}>
              <Input readOnly style={{ width: '200%' }} />
            </Form.Item>
            <Form.Item name="Birthday" label="Birthday" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
            <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select placeholder="Select your gender">
                <Option value="false">Male</Option>
                <Option value="true">Female</Option>
                <Option value="other">Other</Option>
            </Select>
            </Form.Item>
          </div>
          <div>
          <Form.Item name={['user', 'Join Date']} label="Join Date">
            <Input className='text-green-600' readOnly showTime format="YYYY-MM-DDTHH:mm:ss.SSSSSSS" style={{ width: '200%' }} />
          </Form.Item>

            <Form.Item name={['user', 'Status']} label="Status">
              <Input className='text-red-600' readOnly style={{ width: '200%' }} />
            </Form.Item>
          </div>
        </div>

        {/* Bọc 2 button trong div flex */}
        <div className="flex gap-4 mt-10 ml-72">
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
          <Button type="" >
            ForgotPassword
          </Button>
          <Upload action="https://eigakan1111-001-site1.qtempurl.com/api/Media/Upload_Pictures">
            <Button icon={<UploadOutlined />}>Upload</Button>
          </Upload>      
        </div>
      </Form>
    </Spin>
  );
};

export default DetailsProfile;
