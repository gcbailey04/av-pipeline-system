// lib/db/pipelineService.ts

import { PrismaClient } from '@prisma/client';
import { LocalFileStorage } from '../storage/localFileStorage';

export class PipelineService {
  private prisma: PrismaClient;
  private storage: LocalFileStorage;

  constructor() {
    this.prisma = new PrismaClient();
    this.storage = new LocalFileStorage();
  }

  // Initialize storage
  async initialize() {
    await this.storage.initialize();
  }

  // Customer operations
  async createCustomer(data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    isReturnCustomer?: boolean;
  }) {
    return this.prisma.customer.create({
      data: {
        ...data,
        lastInteraction: new Date(),
      },
    });
  }

  // Sales card operations
  async createSalesCard(data: {
    customerId: string;
    projectNumber: string;
    title: string;
    description: string;
    stage: string;
    estimateValue: number;
    dueDate?: Date;
    appointmentDate?: Date;
  }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create directory structure for the project
    await this.storage.createCustomerDirectory(customer.name, data.projectNumber);

    return this.prisma.salesCard.create({
      data: {
        ...data,
        lastInteraction: new Date(),
      },
    });
  }

  // Integration card operations
  async createIntegrationCard(data: {
    customerId: string;
    salesCardId: string;
    projectNumber: string;
    title: string;
    description: string;
    stage: string;
    dueDate?: Date;
  }) {
    return this.prisma.integrationCard.create({
      data: {
        ...data,
        lastInteraction: new Date(),
      },
    });
  }

  // Service card operations
  async createServiceCard(data: {
    customerId: string;
    projectNumber: string;
    title: string;
    description: string;
    stage: string;
    serviceType: string;
    dueDate?: Date;
    rmaNumber?: string;
    partsRequired?: string[];
  }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create directory structure for the project
    await this.storage.createCustomerDirectory(customer.name, data.projectNumber);

    return this.prisma.serviceCard.create({
      data: {
        ...data,
        lastInteraction: new Date(),
      },
    });
  }

  // Rental card operations
  async createRentalCard(data: {
    customerId: string;
    projectNumber: string;
    title: string;
    description: string;
    stage: string;
    eventDate?: Date;
    dueDate?: Date;
    equipmentList: string[];
    quoteValue: number;
  }) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Create directory structure for the project
    await this.storage.createCustomerDirectory(customer.name, data.projectNumber);

    return this.prisma.rentalCard.create({
      data: {
        ...data,
        lastInteraction: new Date(),
      },
    });
  }

  // Document operations
  async addDocument(data: {
    cardType: 'sales' | 'integration' | 'service' | 'rental';
    cardId: string;
    file: Express.Multer.File;
    type: 'estimate' | 'co' | 'photo' | 'documentation' | 'programming';
  }) {
    const card = await this.getCardById(data.cardType, data.cardId);
    if (!card) {
      throw new Error('Card not found');
    }

    const customer = await this.prisma.customer.findUnique({
      where: { id: card.customerId },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Map document type to directory structure
    const categoryMap = {
      estimate: 'Signed Original Estimate',
      co: 'Signed COs',
      photo: 'Job Documentation/Progress Photos',
      documentation: 'Job Documentation/As-Built Documentation',
      programming: 'Job Documentation/Programming Files',
    };

    // Save file to local storage
    const savedFile = await this.storage.saveFile(
      customer.name,
      card.projectNumber,
      categoryMap[data.type],
      data.file
    );

    // Create document record in database
    return this.prisma.document.create({
      data: {
        fileName: savedFile.filename,
        path: savedFile.path,
        type: data.type,
        [`${data.cardType}CardId`]: data.cardId,
      },
    });
  }

  // Helper method to get card by type and id
  private async getCardById(cardType: string, cardId: string) {
    const cardTypeMap = {
      sales: this.prisma.salesCard,
      integration: this.prisma.integrationCard,
      service: this.prisma.serviceCard,
      rental: this.prisma.rentalCard,
    };

    return cardTypeMap[cardType].findUnique({
      where: { id: cardId },
    });
  }

  // Pipeline operations
  async getPipeline(type: 'sales' | 'integration' | 'service' | 'rental') {
    const cardTypeMap = {
      sales: this.prisma.salesCard,
      integration: this.prisma.integrationCard,
      service: this.prisma.serviceCard,
      rental: this.prisma.rentalCard,
    };

    const cards = await cardTypeMap[type].findMany({
      include: {
        customer: true,
        documents: true,
      },
    });

    // Group cards by stage
    const columns = {};
    cards.forEach(card => {
      if (!columns[card.stage]) {
        columns[card.stage] = [];
      }
      columns[card.stage].push(card);
    });

    return Object.entries(columns).map(([stage, cards]) => ({
      id: stage,
      title: stage,
      cards,
    }));
  }

  // Update card stage
  async updateCardStage(
    cardType: 'sales' | 'integration' | 'service' | 'rental',
    cardId: string,
    newStage: string
  ) {
    const cardTypeMap = {
      sales: this.prisma.salesCard,
      integration: this.prisma.integrationCard,
      service: this.prisma.serviceCard,
      rental: this.prisma.rentalCard,
    };

    return cardTypeMap[cardType].update({
      where: { id: cardId },
      data: {
        stage: newStage,
        lastModified: new Date(),
        lastInteraction: new Date(),
      },
    });
  }
}