// Mock Prisma implementation for development
// This helps when the database is not fully set up but you want to test the UI
// Based on actual schema models from prisma/schema.prisma

export const mockPrisma = {
  // Sales Card operations
  salesCard: {
    create: async (data: any) => {
      console.log('Mock: Creating sales card', data);
      return { 
        id: data.data.id, 
        ...data.data,
        type: 'sales',
        documents: [],
        customer: { id: data.data.customerId, name: 'Mock Customer' }
      };
    },
    update: async (data: any) => {
      console.log('Mock: Updating sales card', data);
      return { id: data.where.id, ...data.data, type: 'sales' };
    },
    delete: async (data: any) => {
      console.log('Mock: Deleting sales card', data);
      return { id: data.where.id };
    },
    findUnique: async (data: any) => {
      console.log('Mock: Finding sales card', data);
      return { id: data.where.id, type: 'sales', customerId: 'mock-customer' };
    },
    findMany: async (data?: any) => {
      console.log('Mock: Finding sales cards', data);
      return [{ id: 'mock-card', type: 'sales', stage: 'New Lead', title: 'Mock Card' }];
    }
  },
  
  // Service Card operations
  serviceCard: {
    create: async (data: any) => {
      console.log('Mock: Creating service card', data);
      return { 
        id: data.data.id, 
        ...data.data,
        type: 'service',
        documents: [],
        customer: { id: data.data.customerId, name: 'Mock Customer' }
      };
    },
    update: async (data: any) => {
      console.log('Mock: Updating service card', data);
      return { id: data.where.id, ...data.data, type: 'service' };
    },
    delete: async (data: any) => {
      console.log('Mock: Deleting service card', data);
      return { id: data.where.id };
    },
    findUnique: async (data: any) => {
      console.log('Mock: Finding service card', data);
      return { id: data.where.id, type: 'service', customerId: 'mock-customer' };
    },
    findMany: async (data?: any) => {
      console.log('Mock: Finding service cards', data);
      return [{ id: 'mock-card', type: 'service', stage: 'Request Received', title: 'Mock Card' }];
    }
  },
  
  // Rental Card operations
  rentalCard: {
    create: async (data: any) => {
      console.log('Mock: Creating rental card', data);
      return { 
        id: data.data.id, 
        ...data.data,
        type: 'rental',
        documents: [],
        customer: { id: data.data.customerId, name: 'Mock Customer' }
      };
    },
    update: async (data: any) => {
      console.log('Mock: Updating rental card', data);
      return { id: data.where.id, ...data.data, type: 'rental' };
    },
    delete: async (data: any) => {
      console.log('Mock: Deleting rental card', data);
      return { id: data.where.id };
    },
    findUnique: async (data: any) => {
      console.log('Mock: Finding rental card', data);
      return { id: data.where.id, type: 'rental', customerId: 'mock-customer' };
    },
    findMany: async (data?: any) => {
      console.log('Mock: Finding rental cards', data);
      return [{ id: 'mock-card', type: 'rental', stage: 'Request Received', title: 'Mock Card' }];
    }
  },
  
  // Integration Card operations
  integrationCard: {
    create: async (data: any) => {
      console.log('Mock: Creating integration card', data);
      return { 
        id: data.data.id, 
        ...data.data,
        type: 'integration',
        documents: [],
        customer: { id: data.data.customerId, name: 'Mock Customer' }
      };
    },
    update: async (data: any) => {
      console.log('Mock: Updating integration card', data);
      return { id: data.where.id, ...data.data, type: 'integration' };
    },
    delete: async (data: any) => {
      console.log('Mock: Deleting integration card', data);
      return { id: data.where.id };
    },
    findUnique: async (data: any) => {
      console.log('Mock: Finding integration card', data);
      return { id: data.where.id, type: 'integration', customerId: 'mock-customer' };
    },
    findMany: async (data?: any) => {
      console.log('Mock: Finding integration cards', data);
      return [{ id: 'mock-card', type: 'integration', stage: 'Approved', title: 'Mock Card' }];
    }
  },
  
  // Customer operations
  customer: {
    create: async (data: any) => {
      console.log('Mock: Creating customer', data);
      return { id: 'cust-' + Date.now(), ...data.data };
    },
    findUnique: async (data: any) => {
      console.log('Mock: Finding customer', data);
      return { id: data.where.id, name: 'Mock Customer' };
    },
    findMany: async () => {
      console.log('Mock: Finding all customers');
      return [{ id: 'mock-customer', name: 'Mock Customer' }];
    }
  },
  
  // Document operations
  document: {
    create: async (data: any) => {
      console.log('Mock: Creating document', data);
      return { id: 'doc-' + Date.now(), ...data.data };
    },
    delete: async (data: any) => {
      console.log('Mock: Deleting document', data);
      return { id: data.where.id };
    },
    findUnique: async (data: any) => {
      console.log('Mock: Finding document', data);
      return { id: data.where.id, path: '/mock/path' };
    },
    deleteMany: async (data: any) => {
      console.log('Mock: Deleting many documents', data);
      return { count: 1 };
    }
  },
  
  // These models match your prisma schema
  $transaction: async (operations: any[]) => {
    console.log('Mock: Transaction with operations:', operations.length);
    return operations.map(op => typeof op === 'function' ? op() : op);
  }
};