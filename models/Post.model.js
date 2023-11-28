const { default: mongoose } = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    authorId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);
