import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/lib/db"

const registerSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(50),
  email: z.string().email("بريد إلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
})

/**
 * POST /api/auth/register
 * Creates a new user account. Passwords are hashed with bcrypt (10 rounds).
 */
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return NextResponse.json(
        { success: false, error: firstError?.message ?? "بيانات غير صالحة" },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data
    const normalizedEmail = email.trim().toLowerCase()

    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "هذا البريد الإلكتروني مسجّل بالفعل" },
        { status: 409 }
      )
    }

    const hashed = await bcrypt.hash(password, 10)
    await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashed,
      },
    })

    return NextResponse.json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
    })
  } catch (err) {
    console.error("[register] error:", err)
    return NextResponse.json(
      { success: false, error: "حدث خطأ أثناء إنشاء الحساب" },
      { status: 500 }
    )
  }
}
