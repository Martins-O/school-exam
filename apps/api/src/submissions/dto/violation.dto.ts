import { IsIn } from 'class-validator';

export class ViolationDto {
  @IsIn(['tab_switch', 'fullscreen_exit'])
  type: 'tab_switch' | 'fullscreen_exit';
}
