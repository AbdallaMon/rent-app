import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify authentication
async function verifyAuth(requiredPermission = 'canRead') {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }
    
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        privileges: {
          where: { area: 'WHATSAPP' },
          include: { privilege: true }
        }
      }
    });
    
    if (!user || !user.privileges.some(p => p.privilege[requiredPermission])) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

// Get all templates
export async function GET(request) {
  try {
    const user = await verifyAuth('canRead');
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    const templates = await prisma.whatsappTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json({      templates: templates.map(template => ({
        id: template.id,
        name: template.name,
        content: template.description || (template.components?.text) || '',
        category: template.category || 'عام',
        isActive: template.isActive !== false,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'خطأ في تحميل القوالب' },
      { status: 500 }
    );
  }
}

// Create new template
export async function POST(request) {
  try {
    const user = await verifyAuth('canWrite');
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بإنشاء القوالب' },
        { status: 401 }
      );
    }

    const body = await request.json();    const { name, content, category } = body;

    if (!name || !content) {
      return NextResponse.json(
        { error: 'اسم القالب والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    const template = await prisma.whatsappTemplate.create({
      data: {
        name,
        displayName: name,
        description: content,
        category: category || 'عام',
        components: { text: content }, // Store content in components field
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        content: template.content,
        category: template.category,
        isActive: template.isActive,
        createdAt: template.createdAt
      },
      message: 'تم إنشاء القالب بنجاح'
    });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'خطأ في إنشاء القالب' },
      { status: 500 }
    );
  }
}

// Update template
export async function PUT(request) {
  try {
    const user = await verifyAuth('canEdit');
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بتعديل القوالب' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, content, category, isActive } = body;

    if (!id || !name || !content) {
      return NextResponse.json(
        { error: 'معرف القالب والاسم والمحتوى مطلوبان' },
        { status: 400 }
      );
    }    const template = await prisma.whatsappTemplate.update({
      where: { id: id },
      data: {
        name,
        displayName: name,
        description: content,
        category: category || 'عام',
        components: { text: content },
        isActive: isActive !== false
      }
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        content: template.content,
        category: template.category,
        isActive: template.isActive,
        updatedAt: template.updatedAt
      },
      message: 'تم تحديث القالب بنجاح'
    });

  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'خطأ في تحديث القالب' },
      { status: 500 }
    );
  }
}

// Delete template
export async function DELETE(request) {
  try {
    const user = await verifyAuth('canDelete');
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح بحذف القوالب' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف القالب مطلوب' },
        { status: 400 }
      );
    }    await prisma.whatsappTemplate.delete({
      where: { id: id }
    });

    return NextResponse.json({
      success: true,
      message: 'تم حذف القالب بنجاح'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json(
      { error: 'خطأ في حذف القالب' },
      { status: 500 }
    );
  }
}
