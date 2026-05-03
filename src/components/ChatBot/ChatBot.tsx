import React, { useState, useRef, useEffect } from 'react';
import { generateText } from '../../services/openclawClient';
import { MessageList, Message } from './MessageList';
import { ChatInput } from './ChatInput';
import { useTableStore, TableParameters } from '../../store/useTableStore';
import { ScrollArea } from '../ui/scroll-area';

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: '你好！我是你的 AI 家具设计师。今天我能帮你如何定制你的桌子？' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const { parameters, setParameters, setScenePrompt } = useTableStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Convert history to OpenAI chat format
      const chatMessages: { role: "user" | "assistant"; content: string }[] = newMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content
      }));

      const systemInstruction = `你是一位资深家具设计师和参数化控制代理。
      当前的桌子参数: ${JSON.stringify(parameters)}。

      分析用户的意图（风格、尺寸、场景等）。

      输出要求：你必须严格返回一个有效的 JSON 对象，包含更新后的参数（仅包含发生变化的参数）和一段简短的回复文字（中文），解释你的修改。
      同时，提取任何风格或场景关键词（例如："简约书房"、"工业风办公室"）并作为 'scenePrompt' 返回。

      格式示例: {
        "updatedParameters": { "tableLength": 60, "legWidth": 30 },
        "reply": "我增加了桌面长度并调整了桌腿宽度，使其看起来更加稳重。",
        "scenePrompt": "简约书房"
      }`;

      const result = await generateText(
        [{ role: "system", content: systemInstruction }, ...chatMessages],
        {
          jsonMode: true,
          schema: {
            name: "chat_response",
            schema: {
              type: "object",
              properties: {
                updatedParameters: {
                  type: "object",
                  properties: {
                    tableLength: { type: "number" },
                    tableWidth: { type: "number" },
                    cornerRadius: { type: "number" },
                    legHeight: { type: "number" },
                    legWidth: { type: "number" },
                    legFlare: { type: "number" },
                    legInset: { type: "number" },
                    apronHeight: { type: "number" },
                    colorHue: { type: "number" },
                    metalness: { type: "number" },
                    roughness: { type: "number" }
                  },
                  description: "需要更新的参数"
                },
                reply: {
                  type: "string",
                  description: "给用户的中文回复"
                },
                scenePrompt: {
                  type: "string",
                  description: "提取的场景/风格关键词"
                }
              },
              required: ["updatedParameters", "reply"],
              additionalProperties: false
            },
            strict: true
          }
        }
      );

      const data = result.json || {};

      if (data.updatedParameters) {
        const sanitizedParams: Partial<TableParameters> = {};
        const validKeys = Object.keys(parameters);

        Object.entries(data.updatedParameters).forEach(([key, value]) => {
          if (validKeys.includes(key) && typeof value === 'number' && !isNaN(value)) {
            // @ts-ignore
            sanitizedParams[key as keyof TableParameters] = value;
          }
        });

        if (Object.keys(sanitizedParams).length > 0) {
          setParameters(sanitizedParams);
        }
      }

      if (data.scenePrompt) {
        setScenePrompt(data.scenePrompt as string);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: (data.reply as string) || "我已经根据您的要求更新了设计。"
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "抱歉，我在处理您的请求时遇到了错误。请稍后再试。"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea ref={scrollRef} className="flex-1 min-h-0 px-1">
        <MessageList messages={messages} />
      </ScrollArea>
      <ChatInput onSend={handleSend} isLoading={isLoading} />
    </div>
  );
};
