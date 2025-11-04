# vite 的配置及打包优化配置（具体参考可看 vite.config.ts 配置文件）

VITE-USE-production/
├── index.html                    # 入口 HTML 文件
├── assets/
│    ├── css/
│    │ └── [name]-[hash].[ext]    # 代码分割的 CSS 文件
│    ├── js/
│    │ ├── vue-vendors.[hash].js  # vue框架相关文件
│    │ └── [name]-[hash].js       # 代码分割的 JS 文件
│    ├── images/
│    │ └── [name]-[hash].[ext]    # 图片资源
│    ├── fonts/
│    │ └── [name]-[hash].[ext]    # 字体文件
└── favicon.ico                   # 网站图标

1. 配置

- 在开发环境下 command 的值为 serve（在 CLI 中， vite dev 和 vite serve 是 vite 的别名）
- 而在生产环境下为 build（vite build）

```ts
import {defineConfig} from "vite"
// 基础配置
export default defineConfig {
  // 配置项
}

// 情景配置 按情况灵活配置
export default defineConfig(({ command, mode, isSsrBuild, isPreview }) => {
  if(command === 'serve') {
    return {
      // dev特有配置
    }
  }
  if(command === 'build') {
    return {
      // build特有配置
    }
  }
})
```

2. 环境变量获取

- 根据当前工作目录中的 `mode` 加载 .env 文件
- 设置第三个参数为 '' 来加载所有环境变量，没有设置则加载定义在 .env、.env.local、.env.[mode] 或 .env.[mode].local 中的变量
- 自定义环境变量需要以 **VITE\_**开头

```ts
import { defineConfig, loadEnv } from "vite";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
});
```

3. 共享配置

- root 项目根目录

  - 默认值是 process.cwd()（node 进程的当前工作目录）

- base 开发或生产环境服务的公共基础路径

  - 默认值是"/"

  ```ts
  //假设现在访问的域名是https://example.com
  export default defineConfig(({ mode }) => {
    base: "/"; //那么访问资源路径就是https://example.com
  });

  //如果资源部署在了二级目录/admin
  export default defineConfig(({ mode }) => {
    base: "/admin"; //那么访问资源路径就应该是https://example.com/admin
  });
  ```

- plugins: 插件数组，需要用到的插件数组

- publicDir: 作为静态资源服务的文件夹。该目录中的文件在开发期间在 / 处提供，并在构建期间复制到 outDir 的根目录，并且始终按原样提供或复制而无需进行转换。

  - 默认值是 **public**，也可以设为 false 关闭此功能

- resolve.alias: 当使用文件系统路径的别名时，请始终使用绝对路径。相对路径的别名值会原封不动地被使用，因此无法被正常解析。

  ```ts
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)), //配置后 @ 就相当于/src
      },
    },
  ```

- css

  - preprocessorOptions: 指定传递给 CSS 预处理器的选项

  ```ts
    css: {
      preprocessorOptions: {
        //scss配置
        scss: {
          additionalData: `@use "@/style/varible.scss" as *;` //全局自动引入scss变量
          importers: (url, prev, done) => {
            //自定义导入
          }
        },
        //less配置
        less: {
          additionalData: `@import "@/style/varible.scss";`
          modifyVars: {
            "$main": "green"
          },
          javascriptEnabled: true //开启less中的js特性
        }
      }
    },
  ```

4. 服务器选项 server

- host: 指定服务器应该监听哪个 IP 地址。 如果将此设置为 0.0.0.0 或者 true 将监听所有地址，包括局域网和公网地址。
- port: 开发服务器端口
- open: 是否自动打开应用程序
- proxy: 为开发服务器配置自定义代理规则
  ```ts
    server: {
      // 设置代理后发送http://localhost:5000/api/bar 会代理到 http://test.com/bar
      proxy: {
        "/api": {
          target: "https://test.com",
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    }
  ```

5. 构建选项 build

- target: 最终软件包的浏览器兼容性目标

  - 默认值是 Vite 的一个特殊值 'baseline-widely-available。具体来说，它是 ['chrome107', 'edge107', 'firefox104', 'safari16']
  - 自定义目标也可以是一个 ES 版本（例如：es2015）、一个浏览器版本（例如：chrome58）或是多个目标组成的一个数组

- outDir: 指定输出路径

  - 默认是 dist

- assetsDir: 指定生成静态资源的存放路径（相对于 build.outDir）

  - 默认是 assets

- assetsInlineLimit: 小于此阈值的导入或引用资源将内联为 base64 编码，以避免额外的 http 请求。设置为 0 可以完全禁用此项。

  - 默认 4096 (4 KiB)

- sourcemap: 构建后是否生成 source map 文件，便于生产环境定位错误位置

  - 如果为 true，将会创建一个独立的 source map 文件。
  - 如果为 'inline'，source map 将作为一个 data URI 附加在输出文件中。
  - 'hidden' 的工作原理与 true 相似，只是 bundle 文件中相应的注释将不被保留

- rollupOptions: 自定义底层 rollup 配置

  ```ts
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
        assetFileNames: (chunkInfo) => {
          const {names} = chunkInfo
          if(/\.(png|jpe?g|gif|svg|ico)/.test(names[0])) {
            return "assets/image/[name]-[hash].[ext]" //[ext]: 不包含点的文件扩展名，例如css
          }
          if(/\.(woff|woff2|eot|tff)/.test(names[0])) {
            return "assets/font/[name]-[hash].[ext]"
          }
          if(/\.(css|scss|sass|less|stylus|styl)/.test(names[0])) {
            return "assets/css/[name]-[hash].[ext]"
          }
          return "assets/[name]-[hash].[ext]"
        }
      },
    },
  ```

- 依赖优化选项（预构建），optimaizeDeps

```ts
optimaizeDeps: {
  include: ["vue", "vue-router", "lodash"], //默认情况下，不在 node_modules 中的，链接的包不会被预构建。使用此选项可强制预构建链接的包
  exclude: [], //在预构建中强制排除的依赖项
  fource: false, //设置为 true 可以强制依赖预构建，而忽略之前已经缓存过的、已经优化过的依赖。
},
```

6. 去除生产环境日志

```ts
  esbuild: {
    drop: ["console", "debugger"],
  },
```

7. 压缩代码 vite-plugin-compression 插件（需先下载插件）

```powershell
pnpm add vite-plugin-compression -D
```

```ts
import viteCompression from "vite-plugin-compression";

plugins: [
  viteCompression({
    verbose: true, //输出详细压缩信息
    disable: false, //是否禁用
    threshold: 1024000, //文件大小超过设定阈值才会被压缩
    algorithm: "gzip", //压缩算法
    ext: ".gz", //压缩文件后缀
    deleteOriginFile: false, //是否删除源文件
  }),
];
```

7. 图片资源压缩 vite-plugin-imagemin 插件（需先下载插件）

```powershell
pnpm add vite-plugin-imagemin -D
```

```ts
import viteImagemin from "vite-plugin-imagemin";

plugins: [
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
];
```
