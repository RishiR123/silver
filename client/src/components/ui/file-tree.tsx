"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

export interface FileNode {
  name: string
  type: "file" | "folder"
  children?: FileNode[]
  extension?: string
}

interface FileTreeProps {
  data: FileNode[]
  className?: string
}

interface FileItemProps {
  node: FileNode
  depth: number
  isLast: boolean
  parentPath: boolean[]
}

const getFileIcon = (extension?: string) => {
  const iconMap: Record<string, { color: string; icon: string }> = {
    tsx: { color: "text-[oklch(0.65_0.18_220)]", icon: "⚛" },
    ts:  { color: "text-[oklch(0.6_0.15_230)]",  icon: "◆" },
    jsx: { color: "text-[oklch(0.7_0.2_200)]",   icon: "⚛" },
    js:  { color: "text-[oklch(0.8_0.18_90)]",   icon: "◆" },
    css: { color: "text-[oklch(0.65_0.2_280)]",  icon: "◈" },
    json:{ color: "text-[oklch(0.75_0.15_85)]",  icon: "{}" },
    md:  { color: "text-ink-5",                   icon: "◊" },
    svg: { color: "text-[oklch(0.7_0.15_160)]",  icon: "◐" },
    png: { color: "text-[oklch(0.65_0.12_160)]", icon: "◑" },
    py:  { color: "text-[oklch(0.7_0.18_140)]",  icon: "◆" },
    sh:  { color: "text-[oklch(0.75_0.1_120)]",  icon: "◇" },
    default: { color: "text-ink-6", icon: "◇" },
  }
  return iconMap[extension ?? "default"] ?? iconMap.default
}

function FileItem({ node, depth, isLast, parentPath }: FileItemProps) {
  const [isOpen, setIsOpen] = useState(depth < 2)
  const [isHovered, setIsHovered] = useState(false)

  const isFolder = node.type === "folder"
  const hasChildren = isFolder && node.children && node.children.length > 0
  const fileIcon = getFileIcon(node.extension)

  return (
    <div className="select-none">
      <div
        className={cn(
          "group relative flex items-center gap-2 py-[3px] px-2 rounded-md cursor-pointer",
          "transition-colors duration-150",
          isHovered && "bg-file-tree-hover",
        )}
        onClick={() => isFolder && setIsOpen(!isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {depth > 0 && (
          <div
            className="absolute top-0 bottom-0 flex"
            style={{ left: `${(depth - 1) * 14 + 16}px` }}
          >
            <div className={cn("w-px transition-colors duration-150", isHovered ? "bg-tree-line-hover" : "bg-tree-line")} />
          </div>
        )}

        {/* Chevron / file symbol */}
        <div className={cn("flex items-center justify-center w-3.5 h-3.5 transition-transform duration-150 flex-shrink-0", isFolder && isOpen && "rotate-90")}>
          {isFolder ? (
            <svg width="5" height="8" viewBox="0 0 6 8" fill="none" className={cn("transition-colors duration-150", isHovered ? "text-ink-3" : "text-ink-6")}>
              <path d="M1 1L5 4L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className={cn("text-[10px] transition-opacity duration-150", fileIcon.color)}>{fileIcon.icon}</span>
          )}
        </div>

        {/* Folder / file icon */}
        <div className={cn(
          "flex items-center justify-center w-4 h-4 rounded flex-shrink-0 transition-all duration-150",
          isFolder
            ? isHovered ? "text-folder-icon scale-105" : "text-folder-icon/70"
            : isHovered ? cn(fileIcon.color, "scale-105") : cn(fileIcon.color, "opacity-60"),
        )}>
          {isFolder ? (
            <svg width="14" height="12" viewBox="0 0 16 14" fill="currentColor">
              <path d="M1.5 1C0.671573 1 0 1.67157 0 2.5V11.5C0 12.3284 0.671573 13 1.5 13H14.5C15.3284 13 16 12.3284 16 11.5V4.5C16 3.67157 15.3284 3 14.5 3H8L6.5 1H1.5Z" />
            </svg>
          ) : (
            <svg width="11" height="14" viewBox="0 0 14 16" fill="currentColor" opacity="0.7">
              <path d="M1.5 0C0.671573 0 0 0.671573 0 1.5V14.5C0 15.3284 0.671573 16 1.5 16H12.5C13.3284 16 14 15.3284 14 14.5V4.5L9.5 0H1.5Z" />
              <path d="M9 0V4.5H14" fill="currentColor" fillOpacity="0.4" />
            </svg>
          )}
        </div>

        {/* Name */}
        <span className={cn(
          "text-[11px] font-mono truncate transition-colors duration-150",
          isFolder
            ? isHovered ? "text-ink-2" : "text-ink-3"
            : isHovered ? "text-ink-3" : "text-ink-5",
        )}>
          {node.name}
        </span>
      </div>

      {hasChildren && (
        <div className={cn("overflow-hidden transition-all duration-200 ease-out", isOpen ? "opacity-100" : "opacity-0 h-0")}
          style={{ maxHeight: isOpen ? `${node.children!.length * 200}px` : "0px" }}
        >
          {node.children!.map((child, index) => (
            <FileItem
              key={child.name}
              node={child}
              depth={depth + 1}
              isLast={index === node.children!.length - 1}
              parentPath={[...parentPath, !isLast]}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function FileTree({ data, className }: FileTreeProps) {
  return (
    <div className={cn("bg-file-tree-bg font-mono", className)}>
      <div className="space-y-0">
        {data.map((node, index) => (
          <FileItem key={node.name} node={node} depth={0} isLast={index === data.length - 1} parentPath={[]} />
        ))}
      </div>
    </div>
  )
}
