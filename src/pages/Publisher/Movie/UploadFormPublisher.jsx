import { useState } from "react";
import { Input, Select, Button, Upload, Card, notification } from "antd";
import { UploadOutlined, PlusOutlined } from "@ant-design/icons";
import mediaApi from "../../../apis/Media/media";
import { useParams } from "react-router-dom";

const { Option } = Select;

const UploadFormPublisher = () => {
  const [medias, setMedias] = useState([]); // Danh sách media
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { id } = useParams();
  // 🟢 Upload File (Ảnh hoặc Video)
  const handleUpload = async (index, file) => {
    setUploading(true);
    setProgress(0);

    try {
      if (file.type.startsWith("video/")) {
        // 🟢 Upload Video
        const createResponse = await fetch("https://eigakan1111-001-site1.qtempurl.com/api/Upload/upload_VideoBunny", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: file.name }),
        });

        const createData = await createResponse.json();
        if (!createResponse.ok) throw new Error("Không thể tạo video");

        const videoId = createData.videoUrl;
        console.log("Video ID:", videoId);

        const xhr = new XMLHttpRequest();
        xhr.open("PUT", `https://video.bunnycdn.com/library/384568/videos/${videoId}`, true);
        xhr.setRequestHeader("AccessKey", "5dd7b859-f5cf-4d94-a0b71073f51a-3048-4dfd");
        xhr.setRequestHeader("Content-Type", "application/octet-stream");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setProgress(percentComplete);
          }
        };

        xhr.onload = () => {
          setUploading(false);
          if (xhr.status === 200) {
            const newVideoUrl = `https://iframe.mediadelivery.net/embed/384568/${videoId}`;
            updateMedia(index, "url", newVideoUrl);
            notification.success({ message: "Upload video thành công!" });
          } else {
            notification.error({ message: "Upload video thất bại!" });
          }
        };

        xhr.onerror = () => {
          setUploading(false);
          notification.error({ message: "Lỗi khi upload video!" });
        };

        xhr.send(file);
      } else {
        // 🟢 Upload Ảnh (Giả lập)
        const reader = new FileReader();
        reader.onload = (e) => {
          updateMedia(index, "url", e.target.result);
          setUploading(false);
          notification.success({ message: "Upload ảnh thành công!" });
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setUploading(false);
      console.error(error);
      notification.error({ message: "Lỗi khi upload file!" });
    }
  };

  // 🟢 Cập nhật media
  const updateMedia = (index, field, value) => {
    const updatedMedias = [...medias];
    updatedMedias[index][field] = value;
    setMedias(updatedMedias);
  };

  // 🟢 Thêm media mới
  const addMedia = () => {
    setMedias([...medias, { name: "", url: "", type: "", movieId: id }]);
  };

  const handleFinish = async () => {
    try {
      const mediaList = medias.filter(media => media.name && media.url && media.type && media.movieId);
  
      await Promise.all(mediaList.map(media => mediaApi.createMedia(media))); // Gọi API nhiều lần
  
      notification.success({ message: "Movies created successfully" });
      navigate("/publisher/movie");
    } catch (error) {
      console.error("Error creating movies:", error);
      notification.error({ message: "Failed to create movies" });
    }
  };
  


  return (
    <div className="p-6 mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Upload Video & Add Media</h1>

      <Card className="p-4 shadow-md">
        {medias.map((media, index) => (
          <div key={index} className="flex gap-2 mb-2 items-center">
            {/* 🟢 Nhập tên Media */}
            <Input
              placeholder="Media Name"
              value={media.name}
              onChange={(e) => updateMedia(index, "name", e.target.value)}
            />

            {/* 🟢 Upload Ảnh/Video */}
            <Upload showUploadList={false} beforeUpload={(file) => handleUpload(index, file)}>
              <Button icon={<UploadOutlined />}>Upload File</Button>
            </Upload>

            {/* 🟢 Hiển thị Preview */}
            {media.url && (
              media.type === "FILM" || media.type === "TRAILER" ? (
                <iframe src={media.url} width="100" height="60" allowFullScreen></iframe>
              ) : (
                <img src={media.url} alt="media" className="w-10 h-10 object-cover rounded" />
              )
            )}

            {/* 🟢 Chọn loại Media */}
            <Select
              placeholder="Type"
              value={media.type}
              onChange={(v) => updateMedia(index, "type", v)}
              className="w-32"
            >
              <Option value="FILMVIP">Film</Option>
              <Option value="TRAILER">Trailer</Option>

            </Select>
          </div>
        ))}

        <Button type="dashed" onClick={addMedia} block icon={<PlusOutlined />}>
          Add Media
        </Button>
      </Card>

      <div className="flex justify-between mt-6">
        <Button type="primary" onClick={handleFinish}>
          Save Movie Data
        </Button>
      </div>
    </div>
  );
};

export default UploadFormPublisher;
