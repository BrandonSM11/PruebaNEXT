import { NextResponse } from "next/server";
import dbConnection from "@/lib/db";
import User from "@/database/models/user";

export async function POST(request: Request) {
  try {
    await dbConnection();

    const body = await request.json();
    const { name, email, password, role } = body;

    // Validaciones
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Todos los campos son obligatorios" },
        { status: 400 }
      );
    }

    if (!["client", "agent"].includes(role)) {
      return NextResponse.json(
        { error: "El rol debe ser 'client' o 'agent'" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 409 }
      );
    }

    // Crear usuario
    const newUser = await User.create({
      name,
      email,
      password, 
      role,
      isActive: true,
    });

    return NextResponse.json(
      {
        message: "Usuario creado exitosamente",
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error al crear usuario:", err);
    return NextResponse.json(
      { error: "Error al crear el usuario" },
      { status: 500 }
    );
  }
}


export async function GET() {
  try {
    await dbConnection();

    const users = await User.find().select("-password");

    return NextResponse.json({
      users,
      total: users.length,
    });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}