import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Database, Reference } from 'firebase-admin/database';

@Injectable()
export class FirebaseService {
  private database: Database;
  private insultsRef: Reference;
  private whitelistRef: Reference;
  private phraseRef: Reference;
  private greetingsRef: Reference;
  private welcomeMessagesRef: Reference;
  private dicesRef: Reference;
  private packagesRef: Reference;

  init() {
    this.database = admin.database();
    this.insultsRef = this.database.ref('insults');
    this.whitelistRef = this.database.ref('openai-whitelist');
    this.phraseRef = this.database.ref('phrases');
    this.greetingsRef = this.database.ref('greetings');
    this.dicesRef = this.database.ref('dices');
    this.welcomeMessagesRef = this.database.ref('welcomeMessages');
    this.packagesRef = this.database.ref('packages');
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
      return snapshot.val();
    });
  }

  getPhrases(): Promise<any[]> {
    this.init();
    return this.phraseRef.once('value').then((snapshot) => {
      return snapshot.val();
    });
  }

  getGreetings(): Promise<any[]> {
    this.init();
    return this.greetingsRef.once('value').then((snapshot) => {
      return snapshot.val();
    });
  }

  getDices(): Promise<any[]> {
    this.init();
    return this.dicesRef.once('value').then((snapshot) => {
      return snapshot.val();
    });
  }

  setPackages(packages: { data: any[]; date: string }): Promise<void> {
    this.init();
    return this.packagesRef.set(packages);
  }

  getPackages(): Promise<{ data: any[]; date: string }> {
    this.init();
    return this.packagesRef.once('value').then((snapshot) => {
      return snapshot.val();
    });
  }
}
