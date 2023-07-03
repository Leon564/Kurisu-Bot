import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './application/controllers/app.controller';
import { ChatService } from './application/services/chat.service';
import { MessageCommandService } from './application/services/message-command.service';
import { FirebaseService } from './application/services/firebase.service';
import { appConfig } from './configs/app.config';
import { firebaseConfig } from './configs/firebase.config';
import { GroupParticipantsCommandService } from './application/services/group-participants-command.service';
import { StickerService } from './application/services/sticker.service';
import { RemoveBgService } from './application/services/remove-bg.service';

@Module({
  controllers: [AppController],
  imports: [ConfigModule.forRoot({ load: [appConfig, firebaseConfig] })],
  providers: [
    MessageCommandService,
    GroupParticipantsCommandService,
    FirebaseService,
    ChatService,
    StickerService,
    RemoveBgService,
  ],
})
export class AppModule {}
