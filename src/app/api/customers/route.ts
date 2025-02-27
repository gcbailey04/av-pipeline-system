// src/app/api/customers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib';

/**
 * GET /api/customers
 * Get all customers or search by name/email
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const id = searchParams.get('id');
  
  try {
    // If ID is provided, fetch single customer
    if (id) {
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          salesCards: true,
          serviceCards: true,
          rentalCards: true,
          integrationCards: true
        }
      });
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(customer);
    }
    
    // Otherwise, fetch all customers or search
    let whereClause = {};
    
    if (search) {
      whereClause = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      };
    }
    
    const customers = await prisma.customer.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      take: 20 // Limit results
    });
    
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Check if customer with this email already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { email: body.email }
    });
    
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'A customer with this email already exists', customer: existingCustomer },
        { status: 409 }
      );
    }
    
    // Create the customer
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone || '',
        address: body.address || '',
        isReturnCustomer: body.isReturnCustomer || false,
        lastInteraction: new Date()
      }
    });
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers
 * Update an existing customer
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      );
    }
    
    // Check if customer exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: body.id }
    });
    
    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Update the customer
    const customer = await prisma.customer.update({
      where: { id: body.id },
      data: {
        name: body.name || existingCustomer.name,
        email: body.email || existingCustomer.email,
        phone: body.phone || existingCustomer.phone,
        address: body.address || existingCustomer.address,
        isReturnCustomer: body.isReturnCustomer ?? existingCustomer.isReturnCustomer,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers
 * Delete a customer
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json(
      { error: 'Customer ID is required' },
      { status: 400 }
    );
  }
  
  try {
    // Check if customer has any associated cards
    const customerHasCards = await prisma.$transaction(async (tx) => {
      const salesCards = await tx.salesCard.count({ where: { customerId: id } });
      const serviceCards = await tx.serviceCard.count({ where: { customerId: id } });
      const rentalCards = await tx.rentalCard.count({ where: { customerId: id } });
      const integrationCards = await tx.integrationCard.count({ where: { customerId: id } });
      
      return salesCards + serviceCards + rentalCards + integrationCards > 0;
    });
    
    if (customerHasCards) {
      return NextResponse.json(
        { error: 'Cannot delete customer with associated cards' },
        { status: 409 }
      );
    }
    
    // Delete the customer
    await prisma.customer.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}