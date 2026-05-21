const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    name:             { type: String, required: true, trim: true },
    address:          { type: String, required: true, trim: true },
    contact:          { type: String, required: true, trim: true },
    email:            { type: String, required: true, trim: true },
    age:              { type: Number, required: true },
    parentPermission: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const classSchema = new mongoose.Schema(
  {
    title:          { type: String, required: [true, "Title is required"], trim: true },
    description:    { type: String, required: [true, "Description is required"] },
    startDate:      { type: Date,   required: [true, "Start date is required"] },
    formDeadline:   { type: Date,   required: [true, "Form deadline is required"] },
    totalSeats:     { type: Number, required: [true, "Total seats required"], min: 1 },
    googleFormLink: { type: String, default: "" },   // Google Form URL for applications
    isClosed:       { type: Boolean, default: false }, // Admin can manually close the class
    createdBy:      { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    applications:   [applicationSchema],
  },
  { timestamps: true }
);

// Virtual: seats available
classSchema.virtual("seatsAvailable").get(function () {
  return this.totalSeats - this.applications.length;
});

classSchema.set("toJSON",   { virtuals: true });
classSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Class", classSchema);
