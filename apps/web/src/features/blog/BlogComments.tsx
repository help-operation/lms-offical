"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Trash2, CornerDownRight, Loader2, Send } from "lucide-react";
import { ConfirmModal } from "@/shared/components/ConfirmModal";
import { blogApiBrowser } from "@/features/blog/api/browser";
import type { BlogComment } from "@/features/blog/api";

// ── Tree builder ──────────────────────────────────────────────────────────────

interface CommentNode extends BlogComment {
  replies: CommentNode[];
}

function buildTree(flat: BlogComment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));

  const roots: CommentNode[] = [];
  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parentId === null) {
      roots.push(node);
    } else {
      map.get(c.parentId)?.replies.push(node);
    }
  });
  return roots;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function CommentAvatar({ firstName, lastName, avatar }: { firstName: string; lastName: string; avatar: string | null }) {
  if (avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatar} alt={firstName} className="h-8 w-8 rounded-full object-cover shrink-0" />;
  }
  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-pink-400 flex items-center justify-center text-white text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

// ── Relative time ─────────────────────────────────────────────────────────────

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── Comment input form ────────────────────────────────────────────────────────

function CommentForm({
  postId,
  parentId,
  placeholder,
  onSubmit,
  onCancel,
  autoFocus,
}: {
  postId: number;
  parentId?: number;
  placeholder?: string;
  onSubmit: (comment: BlogComment) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText]   = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await blogApiBrowser.createComment(postId, {
          content: text.trim(),
          ...(parentId !== undefined ? { parentId } : {}),
        });
        onSubmit(res.data);
        setText("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        ref={textareaRef}
        autoFocus={autoFocus}
        rows={parentId !== undefined ? 2 : 3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? "Write a comment…"}
        className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
      />
      {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 dark:text-gray-500 dark:hover:text-gray-300">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || !text.trim()}
          className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 dark:bg-brand-500 dark:hover:bg-brand-600"
        >
          {isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Send className="h-3.5 w-3.5" />}
          {parentId !== undefined ? "Reply" : "Post"}
        </button>
      </div>
    </form>
  );
}

// ── Single comment (recursive for replies) ────────────────────────────────────

function CommentItem({
  node,
  postId,
  currentUserId,
  isLoggedIn,
  depth,
  onDelete,
  onReply,
}: {
  node: CommentNode;
  postId: number;
  currentUserId: number | null;
  isLoggedIn: boolean;
  depth: number;
  onDelete: (id: number) => void;
  onReply: (parent: CommentNode, comment: BlogComment) => void;
}) {
  const [showReply, setShowReply] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    setShowDeleteConfirm(false);
    startTransition(async () => {
      try {
        await blogApiBrowser.deleteComment(postId, node.id);
        onDelete(node.id);
      } catch {/* ignore */}
    });
  }

  function handleReplyClick() {
    if (!isLoggedIn) { router.push("/login"); return; }
    setShowReply(true);
  }

  const isOwn = currentUserId === node.userId;

  return (
    <>
    <ConfirmModal
      open={showDeleteConfirm}
      title="Delete Comment"
      message="Delete this comment? This cannot be undone."
      confirmLabel="Yes, Delete"
      variant="danger"
      isPending={isPending}
      onConfirm={handleDelete}
      onClose={() => setShowDeleteConfirm(false)}
    />
    <div className={depth > 0 ? "ml-10 mt-3" : ""}>
      <div className="flex gap-3">
        <CommentAvatar firstName={node.authorFirstName} lastName={node.authorLastName} avatar={node.authorAvatar} />

        <div className="flex-1 min-w-0">
          {/* Bubble */}
          <div className="bg-gray-50 rounded-2xl px-4 py-3 group dark:bg-gray-800">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {node.authorFirstName} {node.authorLastName}
              </span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-xs text-gray-400 dark:text-gray-500">{relativeTime(node.createdAt)}</span>
                {isOwn && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isPending}
                    className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 dark:text-gray-600 dark:hover:text-red-400"
                    title="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words dark:text-gray-300">{node.content}</p>
          </div>

          {/* Actions */}
          {depth === 0 && (
            <div className="flex items-center gap-3 mt-1.5 pl-1">
              <button
                onClick={handleReplyClick}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-brand-600 transition-colors dark:text-gray-500 dark:hover:text-brand-400"
              >
                <CornerDownRight className="h-3 w-3" />
                Reply
              </button>
            </div>
          )}

          {/* Reply form */}
          {showReply && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={node.id}
                placeholder={`Reply to ${node.authorFirstName}…`}
                autoFocus
                onSubmit={(c) => { onReply(node, c); setShowReply(false); }}
                onCancel={() => setShowReply(false)}
              />
            </div>
          )}

          {/* Replies */}
          {node.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              node={reply}
              postId={postId}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              depth={depth + 1}
              onDelete={onDelete}
              onReply={onReply}
            />
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  postId: number;
  initialComments: BlogComment[];
  isLoggedIn: boolean;
  currentUserId: number | null;
  currentUserFirstName: string | null;
  currentUserAvatar: string | null;
}

export function BlogComments({
  postId,
  initialComments,
  isLoggedIn,
  currentUserId,
  currentUserFirstName,
  currentUserAvatar,
}: Props) {
  const router = useRouter();
  const [tree, setTree] = useState<CommentNode[]>(() => buildTree(initialComments));

  function handleNewComment(comment: BlogComment) {
    const node: CommentNode = { ...comment, replies: [] };
    setTree((prev) => [...prev, node]);
  }

  function handleReply(parent: CommentNode, reply: BlogComment) {
    const replyNode: CommentNode = { ...reply, replies: [] };
    setTree((prev) =>
      prev.map((c) =>
        c.id === parent.id
          ? { ...c, replies: [...c.replies, replyNode] }
          : c,
      ),
    );
  }

  function handleDelete(id: number) {
    // Remove from top-level or from any reply list
    setTree((prev) =>
      prev
        .filter((c) => c.id !== id)
        .map((c) => ({ ...c, replies: c.replies.filter((r) => r.id !== id) })),
    );
  }

  const totalCount = tree.reduce((acc, c) => acc + 1 + c.replies.length, 0);

  return (
    <section className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800">
      {/* Header */}
      <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900 mb-6 dark:text-white">
        <MessageSquare className="h-5 w-5 text-brand-500 dark:text-brand-400" />
        {totalCount > 0 ? `${totalCount} Comment${totalCount !== 1 ? "s" : ""}` : "Comments"}
      </h2>

      {/* Comment list */}
      {tree.length === 0 ? (
        <p className="text-sm text-gray-400 mb-6 dark:text-gray-500">
          No comments yet. {isLoggedIn ? "Be the first to comment!" : ""}
        </p>
      ) : (
        <div className="space-y-4 mb-8">
          {tree.map((node) => (
            <CommentItem
              key={node.id}
              node={node}
              postId={postId}
              currentUserId={currentUserId}
              isLoggedIn={isLoggedIn}
              depth={0}
              onDelete={handleDelete}
              onReply={handleReply}
            />
          ))}
        </div>
      )}

      {/* New comment box */}
      {isLoggedIn ? (
        <div className="flex gap-3 mt-4">
          <CommentAvatar
            firstName={currentUserFirstName ?? "U"}
            lastName=""
            avatar={currentUserAvatar}
          />
          <div className="flex-1">
            <CommentForm
              postId={postId}
              placeholder="Write a comment…"
              onSubmit={handleNewComment}
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-3 dark:text-gray-400">
            <button
              onClick={() => router.push("/login")}
              className="text-brand-600 font-semibold hover:underline dark:text-brand-400"
            >
              Log in
            </button>
            {" "}to join the discussion
          </p>
        </div>
      )}
    </section>
  );
}
