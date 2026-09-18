import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const [, , username, password, ...nameParts] = process.argv;
const name = nameParts.join(" ");

if (!username || !password || !name) {
  console.error("Usage: node --env-file=.env.local scripts/create-staff.mjs <username> <password> <name>");
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error(
    "Missing MONGODB_URI environment variable. Run with: node --env-file=.env.local scripts/create-staff.mjs ...",
  );
  process.exit(1);
}

const staffSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);
const StaffModel = mongoose.models.Staff ?? mongoose.model("Staff", staffSchema);

await mongoose.connect(MONGODB_URI);

const passwordHash = await bcrypt.hash(password, 10);
const staff = await StaffModel.findOneAndUpdate(
  { username: username.toLowerCase().trim() },
  { username: username.toLowerCase().trim(), passwordHash, name },
  { upsert: true, new: true },
);

console.log(`Staff account ready: ${staff.username} (${staff.name})`);
await mongoose.disconnect();
