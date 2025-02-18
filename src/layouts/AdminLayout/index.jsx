import { DatabaseOutlined } from "@ant-design/icons";

function getItem(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
  };
}

const items = [
  getItem("Genres", "/admin/genres", <DatabaseOutlined />),
];

function AdminLayout() {
  const navigate = useNavigate();
  
  const onClick = (e) => {
    navigate(e.key);
  };

  return (
    <Menu
      onClick={onClick}
      mode="inline"
      items={items}
    />
  );
}

export default AdminLayout; 