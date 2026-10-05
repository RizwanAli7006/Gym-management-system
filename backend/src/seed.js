import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import User from "./models/User.js";
import Gym from "./models/Gym.js";
import Branch from "./models/Branch.js";
import Customer from "./models/Customer.js";
import Trainer from "./models/Trainer.js";
import MembershipPlan from "./models/MembershipPlan.js";
import Payment from "./models/Payment.js";
import Attendance from "./models/Attendance.js";
import { hashPassword } from "./utils/authUtils.js";

dotenv.config();

// Every seeded account shares this password for easy local testing.
const PASSWORD = "Password123";

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const statusFromExpiry = (expiry) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const e = new Date(expiry);
  e.setHours(0, 0, 0, 0);
  const days = Math.ceil((e - today) / (1000 * 60 * 60 * 24));
  if (days < 0) return "EXPIRED";
  if (days <= 7) return "EXPIRING";
  return "ACTIVE";
};

// Blueprint: two owners, three gyms (owner B holds two), branches + members.
const BLUEPRINT = [
  {
    owner: { name: "Olivia Owner", email: "owner.fitlife@gympro.com" },
    gyms: [
      {
        name: "FitLife Center",
        email: "info@fitlife.com",
        phone: "0300-1111111",
        address: "12 Gulberg, Lahore",
        branches: ["FitLife Gulberg", "FitLife DHA"],
        members: 8,
        trainers: 2
      }
    ]
  },
  {
    owner: { name: "Omar Owner", email: "owner.ironworks@gympro.com" },
    gyms: [
      {
        name: "IronWorks Gym",
        email: "info@ironworks.com",
        phone: "0300-2222222",
        address: "5 Clifton, Karachi",
        branches: ["IronWorks Clifton"],
        members: 6,
        trainers: 2
      },
      {
        name: "IronWorks Express",
        email: "express@ironworks.com",
        phone: "0300-3333333",
        address: "88 Johar, Karachi",
        branches: ["IronWorks Johar"],
        members: 4,
        trainers: 1
      }
    ]
  }
];

const run = async () => {
  await connectDB();

  console.log("Clearing existing data...");
  await Promise.all([
    User.deleteMany({}),
    Gym.deleteMany({}),
    Branch.deleteMany({}),
    Customer.deleteMany({}),
    Trainer.deleteMany({}),
    MembershipPlan.deleteMany({}),
    Payment.deleteMany({}),
    Attendance.deleteMany({})
  ]);

  const hashed = await hashPassword(PASSWORD);

  const superAdmin = await User.create({
    name: "Platform Super Admin",
    email: "superadmin@gympro.com",
    password: hashed,
    role: "SUPER_ADMIN",
    isActive: true
  });

  // Shared global plans (gymId null) available to every gym.
  const globalPlans = await MembershipPlan.insertMany([
    { gymId: null, name: "Monthly", price: 3000, durationDays: 30,
      features: ["Gym access", "Locker"] },
    { gymId: null, name: "Quarterly", price: 8000, durationDays: 90,
      features: ["Gym access", "Locker", "1 PT session"] },
    { gymId: null, name: "Annual", price: 28000, durationDays: 365,
      features: ["Gym access", "Locker", "Monthly PT", "Diet plan"] }
  ]);

  const summary = { gyms: 0, branches: 0, members: 0, trainers: 0, payments: 0 };
  let memberSeq = 0;

  for (const entry of BLUEPRINT) {
    const owner = await User.create({
      name: entry.owner.name,
      email: entry.owner.email,
      password: hashed,
      role: "OWNER",
      isActive: true
    });

    for (const g of entry.gyms) {
      const gym = await Gym.create({
        name: g.name,
        email: g.email,
        phone: g.phone,
        address: g.address,
        owner: owner._id,
        status: "ACTIVE"
      });
      summary.gyms += 1;

      // First gym of each owner also keeps gymId on the owner record.
      if (!owner.gymId) {
        owner.gymId = gym._id;
        await owner.save();
      }

      const branches = await Branch.insertMany(
        g.branches.map((name) => ({
          gymId: gym._id,
          name,
          status: "ACTIVE"
        }))
      );
      summary.branches += branches.length;

      // One GYM_ADMIN per gym.
      await User.create({
        name: `${g.name} Admin`,
        email: `admin.${gym._id.toString().slice(-5)}@gympro.com`,
        password: hashed,
        role: "GYM_ADMIN",
        gymId: gym._id,
        branchId: branches[0]?._id || null,
        isActive: true
      });

      for (let i = 0; i < g.trainers; i += 1) {
        await Trainer.create({
          gymId: gym._id,
          branchId: branches[i % branches.length]?._id || null,
          name: `${g.name} Trainer ${i + 1}`,
          specialization: i % 2 === 0 ? "Strength" : "Cardio",
          status: "ACTIVE"
        });
        summary.trainers += 1;
      }

      for (let i = 0; i < g.members; i += 1) {
        const expiry = daysFromNow([-10, 3, 45, 120][i % 4]);
        memberSeq += 1;
        const memberId = `MEM-${String(memberSeq).padStart(5, "0")}`;
        const customer = await Customer.create({
          gymId: gym._id,
          memberId,
          name: `${g.name} Member ${i + 1}`,
          phone: `0311-${gym._id.toString().slice(-4)}${i}`,
          gender: i % 2 === 0 ? "MALE" : "FEMALE",
          membershipPlan: globalPlans[i % globalPlans.length].name,
          membershipStartDate: daysFromNow(-30),
          membershipExpiryDate: expiry,
          membershipStatus: statusFromExpiry(expiry),
          status: "ACTIVE"
        });
        summary.members += 1;

        // A paid payment for most members.
        if (i % 3 !== 0) {
          await Payment.create({
            gymId: gym._id,
            customerId: customer._id,
            planId: globalPlans[i % globalPlans.length]._id,
            amount: globalPlans[i % globalPlans.length].price,
            method: "CASH",
            status: "PAID",
            paidAt: daysFromNow(-(i + 1))
          });
          summary.payments += 1;
        }

        // Today's check-in for a couple of members.
        if (i % 4 === 0) {
          await Attendance.create({
            gymId: gym._id,
            customerId: customer._id,
            checkIn: new Date(),
            date: new Date().toISOString().slice(0, 10)
          });
        }
      }
    }
  }

  console.log("\n================= SEED COMPLETE =================");
  console.log(summary);
  console.log("\nLogin credentials (password for ALL accounts):", PASSWORD);
  console.log("  Super Admin : superadmin@gympro.com");
  BLUEPRINT.forEach((e) => {
    console.log(`  Owner       : ${e.owner.email}`);
  });
  console.log("  Gym Admins  : admin.<gym>@gympro.com (see DB for emails)");
  console.log("================================================\n");

  await mongoose.connection.close();
  process.exit(0);
};

run().catch(async (error) => {
  console.error("Seed failed:", error);
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
  process.exit(1);
});

