import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Database, Reference } from 'firebase-admin/database';

@Injectable()
export class FirebaseService {
  private database: Database;
  private insultsRef: Reference;
  private whitelistRef: Reference;
  private phraseRef: Reference;
  private welcomeMessagesRef: Reference;

  init() {
    this.database = admin.database();
    this.insultsRef = this.database.ref('phrases');
    this.whitelistRef = this.database.ref('whitelist');
    this.phraseRef = this.database.ref('phrases');
    this.welcomeMessagesRef = this.database.ref('welcomeMessages');
  }

  getWhiteList(): Promise<any[]> {
    this.init();
    return this.whitelistRef.once('value').then((snapshot) => {
      return snapshot.val();
    });
  }

  getWelcomeMessages(): Promise<any[]> {
    this.init();
    return this.welcomeMessagesRef.once('value').then((snapshot) => {
      return snapshot.val();
    });
  }

  getInsults(): Promise<any[]> {
    this.init();
    return this.insultsRef.once('value').then((snapshot) => {
      const insults = snapshot.val();
      if (insults) {
        const whitelistArray = Object.values(insults);
        return whitelistArray;
      } else {
        return [];
      }
    });
  }

  getPhrases(): Promise<any[]> {
    this.init();
    return this.phraseRef.once('value').then((snapshot) => {
      const phrase = snapshot.val();
      if (phrase) {
        const whitelistArray = Object.values(phrase);
        return whitelistArray;
      } else {
        return [];
      }
    });
  }
}
