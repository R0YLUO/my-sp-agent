'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../types/chat';
import WorkingBlock from './WorkingBlock';
import CodeBlock from './CodeBlock';

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';
  const showWorking = message.isWorking ?? false;
  const tools = message.activeTools ?? [];

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm whitespace-pre-wrap'
            : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
        }`}
      >
        {/* Working block (assistant only, during intermediate cycles) */}
        {!isUser && showWorking && (
          <WorkingBlock
            content={message.content}
            activeTools={tools}
            isWorking={true}
          />
        )}

        {/* Final message content (not working — render full markdown) */}
        {isUser ? (
          message.content
        ) : (
          <>
            {!showWorking && message.content && (
              <div className="prose prose-sm prose-gray max-w-none prose-pre:my-0 prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre({ children }) {
                      return (
                        <pre className="not-prose my-4 overflow-hidden rounded-lg">
                          {children}
                        </pre>
                      );
                    },
                    code({ className, children, ...rest }) {
                      return (
                        <CodeBlock className={className} {...rest}>
                          {children}
                        </CodeBlock>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
          </>
        )}

        {/* Streaming cursor (only when streaming final content, not during working) */}
        {message.isStreaming && !showWorking && (
          <span className="inline-block w-1.5 h-4 ml-0.5 bg-current align-middle animate-pulse rounded-sm" />
        )}
      </div>
    </div>
  );
}
