import { Breadcrumb, Layout, Image, theme } from "antd";
const { Content } = Layout;
import {
  CreditCardOutlined,
  HistoryOutlined,
  UserOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import authService from "../../apis/Auth/auth";
import DetailsProfile from "./DetailProfile";

const Profile = () => {
  let coverPicture = localStorage.getItem("avatar");
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const updateUser = () => {
      setUser(authService.getCurrentUser());
    };

    authService.addListener(updateUser);

    return () => {
      authService.removeListener(updateUser);
    };
  }, []);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout className="pb-20">
      <Content
        style={{
          padding: "0 48px",
        }}
      >
        <Breadcrumb
          style={{
            margin: "16px 0",
          }}
        >
          <Breadcrumb.Item>
            <Link to="/home">
              <UserOutlined /> Profile{" "}
            </Link>{" "}
            {/* Thêm Link */}
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/list">
              <HistoryOutlined />
              History{" "}
            </Link>{" "}
            {/* Thêm Link */}
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/app">
              <CreditCardOutlined />
              Subscription History{" "}
            </Link>{" "}
            {/* Thêm Link */}
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <Link to="/app">
              <SettingOutlined />
              Setting{" "}
            </Link>{" "}
            {/* Thêm Link */}
          </Breadcrumb.Item>
        </Breadcrumb>
        <div
          style={{
            padding: 24,

            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            display: "flex",
            justifyContent: "initial",
          }}
        >
          <Image width={200} src={coverPicture} />

          <DetailsProfile />
        </div>
      </Content>
    </Layout>
  );
};
export default Profile;
