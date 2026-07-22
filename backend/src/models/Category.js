const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    image: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    courseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });

categorySchema.virtual("imageURL").get(function () {
  if (!this.image) return null;
  if (this.image.startsWith("http")) return this.image;
  const BASE_URL =
    process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  return `${BASE_URL}/uploads/categories/${this.image}`;
});

categorySchema.methods.toJSON = function () {
  const category = this.toObject();
  delete category.__v;
  if (category.image) {
    category.imageURL = this.imageURL;
  }
  return category;
};

module.exports = mongoose.model("Category", categorySchema);
