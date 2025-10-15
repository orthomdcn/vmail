import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.tsx'; 
import { MailDetail } from './pages/MailDetail.tsx'; 
import { ConfigContext, AppConfig } from './hooks/useConfig.ts';
// 新增：导入刚刚创建的 Layout 组件
import Layout from './Layout.tsx';
// 新增：为了完整性，我们创建 About 和 Privacy 页面
import { About } from './pages/About.tsx';
import { Privacy } from './pages/Privacy.tsx';
import { Terms } from './pages/Terms.tsx';

const queryClient = new QueryClient();

function App() {
  // 明确 config 的状态类型
  const [config, setConfig] = useState<AppConfig | null>(null);

  useEffect(() => {
    // 从 worker 获取前端配置
    axios.get<AppConfig>('/config').then((res) => {
      setConfig(res.data);
    });
  }, []);

  if (!config) {
    // 您可以替换成一个更美观的加载动画
    return <div className="flex justify-center items-center min-h-screen bg-[#1f2023] text-white">加载中...</div>;
  }

  return (
    <ConfigContext.Provider value={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* 修复：使用 Layout 组件作为布局路由 */}
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/mails/:id" element={<MailDetail />} />
              {/* 新增：添加 About 和 Privacy 路由 */}
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigContext.Provider>
  );
}

export default App;