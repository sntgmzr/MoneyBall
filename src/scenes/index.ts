import type React from 'react';
import type {SceneId} from '../timeline';
import {E01Gancho} from './E01_Gancho';
import {E02Idea} from './E02_Idea';
import {E03Tendencia} from './E03_Tendencia';
import {E04Funding} from './E04_Funding';
import {E05Cartera} from './E05_Cartera';
import {E06Backtest} from './E06_Backtest';
import {E07Paper} from './E07_Paper';
import {E08Escalera} from './E08_Escalera';
import {E09Reglas} from './E09_Reglas';
import {E10Cierre} from './E10_Cierre';

export const SCENE_COMPONENTS: Record<SceneId, React.FC> = {
  E1: E01Gancho,
  E2: E02Idea,
  E3: E03Tendencia,
  E4: E04Funding,
  E5: E05Cartera,
  E6: E06Backtest,
  E7: E07Paper,
  E8: E08Escalera,
  E9: E09Reglas,
  E10: E10Cierre,
};
