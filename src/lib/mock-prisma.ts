// Mock Prisma implementation for development
// This helps when the database is not fully set up but you want to test the UI

export const mockPrisma = {
    card: {
      create: async (data: any) => {
        console.log('Mock: Creating card', data);
        return { 
          id: data.data.id, 
          ...data.data,
          documents: [],
          automationStatus: data.data.automationStatus.create
        };
      },
      update: async (data: any) => {
        console.log('Mock: Updating card', data);
        return { id: data.where.id, ...data.data };
      },
      delete: async (data: any) => {
        console.log('Mock: Deleting card', data);
        return { id: data.where.id };
      },
      findUnique: async (data: any) => {
        console.log('Mock: Finding card', data);
        return { id: data.where.id, type: 'sales' };
      }
    },
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
    automationStatus: {
      delete: async (data: any) => {
        console.log('Mock: Deleting automation status', data);
        return { id: data.where.cardId };
      }
    },
    equipmentStatus: {
      delete: async (data: any) => {
        console.log('Mock: Deleting equipment status', data);
        return { id: data.where.cardId };
      }
    },
    pipeline: {
      findFirst: async (data: any) => {
        console.log('Mock: Finding pipeline', data);
        // Return a mock pipeline with columns
        return {
          id: 'pipeline-' + data.where.type,
          type: data.where.type,
          columns: [
            { 
              id: data.include.columns.where.title,
              title: data.include.columns.where.title
            }
          ]
        };
      }
    }
  };