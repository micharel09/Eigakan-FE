"\"use client"

import { useState } from "react"
import { Steps, Button, message, Layout, Card, Result } from "antd"
import {
  VideoCameraAddOutlined,
  FileAddOutlined,
  FileDoneOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons"
import CreateMoviePublisher from "./create-movie-publisher"
import ContractForm from "./contract-form"
import SignContract from "./sign-contract"
import UploadVideo from "./upload-video"
import ActivateMovie from "./activate-movie"

const { Content } = Layout
const { Step } = Steps

const MovieWorkflow = () => {
  const [current, setCurrent] = useState(0)
  const [movieData, setMovieData] = useState(null)
  const [contractData, setContractData] = useState(null)
  const [signedContract, setSignedContract] = useState(null)
  const [videoData, setVideoData] = useState(null)
  const [loading, setLoading] = useState(false)

  const steps = [
    {
      title: "Create Movie",
      icon: <VideoCameraAddOutlined />,
      content: <CreateMoviePublisher onComplete={handleMovieCreated} />,
    },
    {
      title: "Create Contract",
      icon: <FileAddOutlined />,
      content: <ContractForm movieData={movieData} onComplete={handleContractCreated} />,
    },
    {
      title: "Sign Contract",
      icon: <FileDoneOutlined />,
      content: <SignContract contractData={contractData} onComplete={handleContractSigned} />,
    },
    {
      title: "Upload Video",
      icon: <CloudUploadOutlined />,
      content: <UploadVideo movieData={movieData} onComplete={handleVideoUploaded} />,
    },
    {
      title: "Activate Movie",
      icon: <CheckCircleOutlined />,
      content: <ActivateMovie movieData={movieData} videoData={videoData} onComplete={handleMovieActivated} />,
    },
  ]

  function handleMovieCreated(data) {
    setMovieData(data)
    message.success("Movie created successfully!")
    next()
  }

  function handleContractCreated(data) {
    setContractData(data)
    message.success("Contract created successfully!")
    next()
  }

  function handleContractSigned(data) {
    setSignedContract(data)
    message.success("Contract signed successfully!")
    next()
  }

  function handleVideoUploaded(data) {
    setVideoData(data)
    message.success("Video uploaded successfully!")
    next()
  }

  function handleMovieActivated() {
    message.success("Movie activated successfully!")
    next()
  }

  const next = () => {
    setCurrent(current + 1)
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6 md:p-8 max-w-7xl mx-auto w-full">
        <Card className="mb-6 shadow-sm">
          <Steps current={current} className="mb-8">
            {steps.map((item) => (
              <Step key={item.title} title={item.title} icon={item.icon} />
            ))}
          </Steps>

          <div className="steps-content p-4 border border-gray-200 rounded-md min-h-[400px]">
            {current < steps.length ? (
              steps[current].content
            ) : (
              <Result
                status="success"
                title="Movie Published Successfully!"
                subTitle="Your movie has been created, contracted, and is now live on the platform."
                extra={[
                  <Button
                    type="primary"
                    key="dashboard"
                    onClick={() => (window.location.href = "/publisher/dashboard")}
                  >
                    Go to Dashboard
                  </Button>,
                  <Button key="movies" onClick={() => (window.location.href = "/publisher/movies")}>
                    View My Movies
                  </Button>,
                ]}
              />
            )}
          </div>

          <div className="steps-action mt-6 flex justify-between">
            {current > 0 && current < steps.length && <Button onClick={prev}>Previous</Button>}
            {current === 0 && <div />}
            {current === steps.length && (
              <Button type="primary" onClick={() => (window.location.href = "/publisher/dashboard")}>
                Done
              </Button>
            )}
          </div>
        </Card>
      </Content>
    </Layout>
  )
}

export default MovieWorkflow

