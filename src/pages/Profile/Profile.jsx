
import { Breadcrumb, Layout, Image, Card, Tabs, Tag, Button, Spin, Modal, Form, Input, DatePicker, Radio, Upload, notification } from "antd"
const { Content } = Layout
import { CreditCardOutlined, HistoryOutlined, UserOutlined, SettingOutlined, CrownOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons"
import { useState, useEffect } from "react"
import UserApi from "../../apis/User/user"
import dayjs from "dayjs"
import uploadFileApi from "../../apis/Upload/Upload"
import HistoryTab from "./HistoryTab"
import BillingTab from "./BillingTab"

const Profile = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [updateLoading, setUpdateLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)

  const role = localStorage.getItem("role") || "User"
  const coverPicture = localStorage.getItem("avatar") || "https://placeholder.com/200x200"
  const isVipMember = role === "VIP MEMBER"

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const profileResponse = await UserApi.GetUserProfile()
      console.log("profileResponse:", profileResponse)
      setUser(profileResponse.data)
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const showUpdateModal = () => {
    form.setFieldsValue({
      fullName: user?.fullName,
      gender: user?.gender,
      birthday: user?.birthday ? dayjs(user.birthday, "YYYY-MM-DD") : null,
      picture: user?.picture,
    })
    setIsModalOpen(true)
  }

  const handleUpdate = async () => {
    setUpdateLoading(true)
    try {
      const values = await form.validateFields()
  
      const updatedProfile = {
        fullName: values.fullName,
        gender: values.gender,
        birthday: values.birthday ? values.birthday.format("YYYY-MM-DD") : null,
        picture: user.picture, // Use the existing picture URL
      }
  
      await UserApi.updateUser(user.id, updatedProfile)
      setUser((prevUser) => ({ ...prevUser, ...updatedProfile }))

      // Update LocalStorage
      localStorage.setItem("user", JSON.stringify({ ...user, ...updatedProfile }))

      notification.success({ message: "Profile updated successfully!" })
      setIsModalOpen(false)
    } catch (error) {
      console.error("Update failed:", error)
      notification.error({ message: "Update failed!" })
    } finally {
      setUpdateLoading(false)
    }
  }

  const handleUpload = async (file) => {
    setUploadLoading(true)
    try {
      const response = await uploadFileApi.UploadPicture(file)
      
      const imageUrl = response.data[0].url // Assuming the API returns the URL in this format

      // Update the user's picture URL
      const updatedProfile = {
        ...user,
        picture: imageUrl
      }

      await UserApi.updateUser(user.id, updatedProfile)
      setUser(updatedProfile)

      // Update LocalStorage
      localStorage.setItem("user", JSON.stringify(updatedProfile))
      localStorage.setItem("avatar", imageUrl)

      notification.success({ message: "Profile picture updated successfully!" })
    } catch (error) {
      console.error("Upload failed:", error)
      notification.error({ message: "Upload failed!" })
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <Breadcrumb className="mb-6">
          <Breadcrumb.Item>Dashboard</Breadcrumb.Item>
          <Breadcrumb.Item>Profile</Breadcrumb.Item>
        </Breadcrumb>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <Card className="mb-6 shadow-sm">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="relative group">
                  <Image width={200} src={user?.picture || coverPicture} className="rounded-lg" alt="Profile Picture" />
                  <div className="relative group">
                    <Upload 
                      showUploadList={false} 
                      beforeUpload={(file) => { 
                        handleUpload(file)
                        return false 
                      }}
                    >
                      <Button
                        icon={uploadLoading ? <Spin /> : <UploadOutlined />}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        type="primary"
                        disabled={uploadLoading}
                      >
                        {uploadLoading ? 'Uploading...' : 'Upload'}
                      </Button>
                    </Upload>
                  </div>
                </div>
                <div className="flex flex-col gap-4 w-full">
                  <div className="flex justify-between">
                    <h1 className="text-2xl font-bold mb-2">{user?.fullName || "N/A"}</h1>
                    <Button type="primary" onClick={showUpdateModal}>Update</Button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Tag color={isVipMember ? "gold" : "blue"} icon={isVipMember ? <CrownOutlined /> : <UserOutlined />}>{role}</Tag>
                    {user?.status && <Tag color="green">{user.status}</Tag>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-gray-500">Email</p>
                      <p className="font-medium">{user?.email || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Member Since</p>
                      <p className="font-medium">{user?.createDate ? new Date(user.createDate).toLocaleDateString() : "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">DOB</p>
                      <p className="font-medium">{user?.birthday || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium">{user?.gender === true ? "Male" : user?.gender === false ? "Female" : "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            <Card className="shadow-sm">
              <Tabs defaultActiveKey="1" items={[
                { key: "1", label: <span className="flex items-center gap-2"><HistoryOutlined />History</span>, children: <HistoryTab /> }, 
                { key: "2", label: <span className="flex items-center gap-2"><CreditCardOutlined />Billing</span>, children: <BillingTab /> }, 
                { key: "3", label: <span className="flex items-center gap-2"><SettingOutlined />Settings</span>, children: <div>Update in furture</div> }]} 
              />
            </Card>
          </>
        )}
        <Modal 
          title="Update Profile" 
          open={isModalOpen} 
          onCancel={() => setIsModalOpen(false)} 
          onOk={handleUpdate} 
          okText="Save"
          confirmLoading={updateLoading}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: "Please enter full name" }]}><Input /></Form.Item>
            <Form.Item label="Gender" name="gender"><Radio.Group><Radio value={true}>Male</Radio><Radio value={false}>Female</Radio></Radio.Group></Form.Item>
            <Form.Item label="Birthday" name="birthday"><DatePicker format="YYYY-MM-DD" /></Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}
export default Profile