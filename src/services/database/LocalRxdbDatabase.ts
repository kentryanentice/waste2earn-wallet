  async createP2PTransaction(transaction: P2PTransaction): Promise<P2PTransaction> {
    try {
      const result = await this.db.p2p_transactions.insert(transaction);
      return result.toJSON();
    } catch (error) {
      console.error('Error creating P2P transaction:', error);
      throw error;
    }
  }

  async getP2PTransaction(id: string): Promise<P2PTransaction | null> {
    try {
      const result = await this.db.p2p_transactions.findOne({
        selector: { id }
      });
      return result ? result.toJSON() : null;
    } catch (error) {
      console.error('Error getting P2P transaction:', error);
      throw error;
    }
  }

  async updateP2PTransaction(id: string, updates: Partial<P2PTransaction>): Promise<P2PTransaction | null> {
    try {
      const result = await this.db.p2p_transactions.findOne({
        selector: { id }
      });
      if (!result) return null;
      
      const updated = await result.patch(updates);
      return updated.toJSON();
    } catch (error) {
      console.error('Error updating P2P transaction:', error);
      throw error;
    }
  }

  async getP2PTransactionsByStatus(status: P2PTransactionStatus): Promise<P2PTransaction[]> {
    try {
      const results = await this.db.p2p_transactions.find({
        selector: { status }
      });
      return results.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error getting P2P transactions by status:', error);
      throw error;
    }
  }

  async getP2PTransactionsByUser(userId: string): Promise<P2PTransaction[]> {
    try {
      const results = await this.db.p2p_transactions.find({
        selector: {
          $or: [
            { buyerId: userId },
            { sellerId: userId }
          ]
        }
      });
      return results.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error getting P2P transactions by user:', error);
      throw error;
    }
  }

  async createP2POffer(offer: P2POffer): Promise<P2POffer> {
    try {
      const result = await this.db.p2p_offers.insert(offer);
      return result.toJSON();
    } catch (error) {
      console.error('Error creating P2P offer:', error);
      throw error;
    }
  }

  async getP2POffer(id: string): Promise<P2POffer | null> {
    try {
      const result = await this.db.p2p_offers.findOne({
        selector: { id }
      });
      return result ? result.toJSON() : null;
    } catch (error) {
      console.error('Error getting P2P offer:', error);
      throw error;
    }
  }

  async updateP2POffer(id: string, updates: Partial<P2POffer>): Promise<P2POffer | null> {
    try {
      const result = await this.db.p2p_offers.findOne({
        selector: { id }
      });
      if (!result) return null;
      
      const updated = await result.patch(updates);
      return updated.toJSON();
    } catch (error) {
      console.error('Error updating P2P offer:', error);
      throw error;
    }
  }

  async getActiveP2POffers(): Promise<P2POffer[]> {
    try {
      const results = await this.db.p2p_offers.find({
        selector: { status: 'active' }
      });
      return results.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error getting active P2P offers:', error);
      throw error;
    }
  }

  async getP2POffersByUser(userId: string): Promise<P2POffer[]> {
    try {
      const results = await this.db.p2p_offers.find({
        selector: { userId }
      });
      return results.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error getting P2P offers by user:', error);
      throw error;
    }
  }

  async createP2PPaymentVerification(verification: P2PPaymentVerification): Promise<P2PPaymentVerification> {
    try {
      const result = await this.db.p2p_payment_verifications.insert(verification);
      return result.toJSON();
    } catch (error) {
      console.error('Error creating P2P payment verification:', error);
      throw error;
    }
  }

  async getP2PPaymentVerification(id: string): Promise<P2PPaymentVerification | null> {
    try {
      const result = await this.db.p2p_payment_verifications.findOne({
        selector: { id }
      });
      return result ? result.toJSON() : null;
    } catch (error) {
      console.error('Error getting P2P payment verification:', error);
      throw error;
    }
  }

  async updateP2PPaymentVerification(id: string, updates: Partial<P2PPaymentVerification>): Promise<P2PPaymentVerification | null> {
    try {
      const result = await this.db.p2p_payment_verifications.findOne({
        selector: { id }
      });
      if (!result) return null;
      
      const updated = await result.patch(updates);
      return updated.toJSON();
    } catch (error) {
      console.error('Error updating P2P payment verification:', error);
      throw error;
    }
  }

  async getP2PPaymentVerificationsByTransaction(transactionId: string): Promise<P2PPaymentVerification[]> {
    try {
      const results = await this.db.p2p_payment_verifications.find({
        selector: { transactionId }
      });
      return results.map(doc => doc.toJSON());
    } catch (error) {
      console.error('Error getting P2P payment verifications by transaction:', error);
      throw error;
    }
  } 