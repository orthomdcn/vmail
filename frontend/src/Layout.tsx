import { Outlet } from "react-router-dom";
// 修复：确保从正确的相对路径导入组件，并带上 .tsx 扩展名
import { Footer } from "./components/Footer.tsx";
import { Header } from "./components/Header.tsx";

// 这是从您原始的 Remix 项目中的 _h.tsx 文件迁移过来的布局组件
export default function Layout() {
  return (
    // 这个 div 定义了整个应用的深色背景和 flex 布局
    <div className="mx-auto min-h-screen flex flex-col bg-[#1f2023]">
      <Header />
      {/* Outlet 是 react-router-dom 的一个组件，它会在这里渲染匹配到的子路由（即您的各个页面） */}
      <Outlet />
      <Footer />
    </div>
  );
}