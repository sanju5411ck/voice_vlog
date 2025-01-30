const fetchComments = async (postId: string) => {
  try {
    const { data, error } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        profiles:user_id (
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

{/* Comments section */}
{showCommentsForPost === post.id && (
  <div className="mt-2 space-y-2">
    {comments.map((comment) => (
      <div key={comment.id} className="flex items-start space-x-2 p-2 bg-gray-50 rounded">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200">
          {comment.profiles?.avatar_url ? (
            <img
              src={supabase.storage.from('avatars').getPublicUrl(comment.profiles.avatar_url).data.publicUrl}
              alt={comment.profiles.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-500">
                {comment.profiles?.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline space-x-2">
            <span className="text-sm font-medium">{comment.profiles?.username}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-sm text-gray-700">{comment.content}</p>
        </div>
      </div>
    ))}
    {/* Comment input */}
    <div className="flex items-center space-x-2 mt-2">
      <input
        type="text"
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add a comment..."
        className="flex-1 border rounded-full px-4 py-1 text-sm focus:outline-none focus:border-indigo-500"
        onKeyPress={(e) => {
          if (e.key === 'Enter' && newComment.trim()) {
            handleAddComment(post.id);
          }
        }}
      />
      <button
        onClick={() => handleAddComment(post.id)}
        disabled={!newComment.trim()}
        className="text-indigo-600 text-sm font-medium disabled:opacity-50"
      >
        Post
      </button>
    </div>
  </div>
)} 