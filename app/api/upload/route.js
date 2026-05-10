import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = `${Date.now()}_${file.name.replace(/\s/g, "_")}`;

    const filePath = path.join(process.cwd(), "public/uploads", fileName);

    fs.writeFileSync(filePath, buffer);

    const url = `/uploads/${fileName}`;

    return NextResponse.json({ url });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}