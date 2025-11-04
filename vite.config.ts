import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import viteCompression from "vite-plugin-compression";
import viteImagemin from "vite-plugin-imagemin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ""); //获取环境变量
  return {
    base: "/main",
    plugins: [
      vue(),
      vueDevTools(),
      viteCompression({
        verbose: true, //输出详细压缩信息
        disable: false, //是否禁用
        threshold: 1024000, //文件大小超过设定阈值才会被压缩
        algorithm: "gzip", //压缩算法
        ext: ".gz", //压缩文件后缀
        deleteOriginFile: false, //是否删除源文件
      }),
      viteImagemin({
        gifsicle: {
          optimizationLevel: 3, //1-3, 3左右
        },
        mozjpeg: {
          quality: 80,
        },
        pngquant: {
          quality: [0.8, 0.9],
        },
        svgo: {
          plugins: [
            {
              name: "removeViewBox",
            },
            {
              name: "removeEmptyAttrs",
              active: false,
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/style/varible.scss" as *;`,
        },
      },
    },
    server: {
      host: "localhost",
      port: 5000,
      proxy: {
        "/api": {
          target: "https://test.com",
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      target: "es2015",
      outDir: `${env.VITE_APP_NAME}-${env.NODE_ENV}`,
      rollupOptions: {
        output: {
          // 该选项允许你创建自定义的公共块
          manualChunks: {
            "vue-vendor": ["vue", "vue-router"],
            lodash: ["lodash"],
          },
          //该选项用于对代码分割中产生的 chunk 自定义命名
          chunkFileNames: "assets/js/[name]-[hash].js", //[name]: chunk名称; [hash]: 仅基于最终生成的 chunk 内容的哈希值
          //该选项用于指定 chunks 的入口文件模式
          entryFileNames: "assets/js/[name]-[hash].js", //[name]: chunk名称; [hash]: 仅基于最终生成的 chunk 内容的哈希值
          //该选项的值是一个匹配模式，用于自定义构建结果中的静态资源名称
          assetFileNames: chunkInfo => {
            const { names } = chunkInfo;
            if (/\.(png|jpe?g|gif|svg|ico)/.test(names[0])) {
              return "assets/image/[name]-[hash].[ext]"; //[ext]: 不包含点的文件扩展名，例如css
            }
            if (/\.(woff|woff2|eot|tff)/.test(names[0])) {
              return "assets/font/[name]-[hash].[ext]";
            }
            if (/\.(css|scss|sass|less|stylus|styl)/.test(names[0])) {
              return "assets/css/[name]-[hash].[ext]";
            }
            return "assets/[name]-[hash].[ext]";
          },
        },
      },
      // 预构建配置
      optimaizeDeps: {
        include: ["vue", "vue-router", "lodash"], //默认情况下，不在 node_modules 中的，链接的包不会被预构建。使用此选项可强制预构建链接的包
        exclude: [], //在预构建中强制排除的依赖项
        fource: false, //设置为 true 可以强制依赖预构建，而忽略之前已经缓存过的、已经优化过的依赖。
      },
    },
    esbuild: {
      drop: ["console", "debugger"],
    },
  };
});
