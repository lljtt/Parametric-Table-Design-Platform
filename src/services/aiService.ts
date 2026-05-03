/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateText } from "./openclawClient";
import { TableParameters } from "@/store/useTableStore";

export interface XHSCopy {
  title: string;
  content: string;
  tags: string[];
}

export async function generateXHSCopy(params: TableParameters): Promise<XHSCopy> {
  const prompt = `
    作为一名精通小红书（Xiaohongshu）风格的家居博主，请为我设计的一张桌子生成一篇种草文案。

    桌子参数如下：
    - 材质: ${params.materialCategory} (色相: ${params.colorHue}, 金属感: ${params.metalness}, 粗糙度: ${params.roughness})
    - 尺寸: 长 ${params.tableLength}mm, 宽 ${params.tableWidth}mm, 腿高 ${params.legHeight}mm
    - 细节: 腿宽 ${params.legWidth}mm, 桌面圆角 ${params.cornerRadius}

    文案要求：
    1. 标题：极具吸引力，带有一点感性或生活方式的共鸣，使用表情包。
    2. 正文：排版清晰，语气温柔亲切，强调设计的质感、空间感和生活美觉，包含表情包。
    3. 话题标签：5-8个热门相关标签。

    请以 JSON 格式返回结果，包含 title, content, tags (字符串数组) 字段。
  `;

  try {
    const result = await generateText(
      [{ role: "user", content: prompt }],
      {
        jsonMode: true,
        schema: {
          name: "xhs_copy",
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              content: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
            },
            required: ["title", "content", "tags"],
            additionalProperties: false,
          },
          strict: true,
        },
      }
    );

    return result.json as XHSCopy;
  } catch (error) {
    console.error("Failed to generate XHS copy:", error);
    return {
      title: "藏在细节里的家居美学 | 极简主义桌案 ✨",
      content: "晨曦微光穿透落地窗，科技感十足的金属线条在光影中跃动，为您开启诗意办公。设计不仅是形态，更是对生活质感的无声告白。",
      tags: ["家居美学", "参数化设计", "极简生活", "我的私藏好物"]
    };
  }
}
