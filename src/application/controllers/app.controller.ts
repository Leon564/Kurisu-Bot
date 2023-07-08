import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { RequestGroupParticipantsUpdate } from 'src/domain/types/request-group-participants-update.type';
import { RequestMessage } from 'src/domain/types/request-message.type';
import { ResponseMessage } from 'src/domain/types/response-message.type';
import { MessageCommandService } from '../services/message-command.service';
import { GroupParticipantsCommandService } from '../services/group-participants-command.service';
import { handleOptions } from 'src/domain/types/handle-options.type';

@Controller()
export class AppController {
  constructor(
    private readonly messageCommandService: MessageCommandService,
    private readonly groupParticipantsCommandService: GroupParticipantsCommandService,
  ) {}

  @MessagePattern('message')
  onMessage(
    @Payload('data') payload: RequestMessage,
    @Payload('options') options: handleOptions,
  ): Promise<ResponseMessage> {
    return this.messageCommandService.handle(payload, options);
  }

  @MessagePattern('group-participants')
  onGroupParticipantsUpdate(
    @Payload('data') payload: RequestGroupParticipantsUpdate,
  ): Promise<ResponseMessage> {
    return this.groupParticipantsCommandService.handle(payload);
  }
}
