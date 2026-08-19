// Replace/extend this array with exported Excel rows.
// Expected fields: visit, vessel, loa, activity, status, start, end, invoice, date
const REPORT_DATA = [
 {visit:'2604726',vessel:'MCL EXPRESS II',loa:22.38,activity:'PILOTAGE',status:'Closed',start:'2026-06-03 02:30',end:'2026-06-03 03:54',invoice:'51494096',date:'2026-06-03'},
 {visit:'2604766',vessel:'MCL PRESTIJ',loa:73.2,activity:'PILOTAGE',status:'Closed',start:'2026-06-04 11:42',end:'2026-06-05 20:32',invoice:'51494097',date:'2026-06-04'},
 {visit:'2604784',vessel:'REN JIAN 16',loa:260.32,activity:'CMC',status:'Closed',start:'2026-06-05 02:06',end:'2026-06-06 00:40',invoice:'51494098',date:'2026-06-05'},
 {visit:'2604767',vessel:'MCL PUTERA III',loa:24,activity:'PILOTAGE',status:'Closed',start:'2026-06-04 12:45',end:'2026-06-04 14:30',invoice:'51494099',date:'2026-06-04'},
 {visit:'2604328',vessel:'BARGE INFINITI 7',loa:70,activity:'CMC',status:'Closed',start:'2026-05-21 21:18',end:'2026-05-22 12:54',invoice:'51494100',date:'2026-05-21'},
 {visit:'2604947',vessel:'MSC ELBA III',loa:230.98,activity:'CMC',status:'Closed',start:'2026-06-10 10:35',end:'2026-06-10 14:38',invoice:'51494337',date:'2026-06-10'},
 {visit:'2604974',vessel:'PHOENIX',loa:64.95,activity:'CMC',status:'Closed',start:'2026-06-10 09:12',end:'2026-06-10 16:42',invoice:'51494338',date:'2026-06-10'},
 {visit:'2604652',vessel:'ASPIRE',loa:96.5,activity:'CMC',status:'Closed',start:'2026-05-31 21:18',end:'2026-06-01 03:36',invoice:'51494093',date:'2026-05-31'},
 {visit:'2604669',vessel:'MCL PUTERA II',loa:26,activity:'PILOTAGE',status:'Closed',start:'2026-06-01 11:10',end:'2026-06-01 13:00',invoice:'51494094',date:'2026-06-01'},
 {visit:'2604679',vessel:'SHANGHAI EXPRESS',loa:366.52,activity:'CMC',status:'Closed',start:'2026-06-02 07:30',end:'2026-06-04 04:00',invoice:'51494095',date:'2026-06-02'},
 {visit:'2605035',vessel:'EVELYN MAERSK',loa:398.9,activity:'CMC',status:'Closed',start:'2026-06-13 00:20',end:'2026-06-14 13:34',invoice:'51495408',date:'2026-06-13'},
 {visit:'2605036',vessel:'TOCONAO',loa:299.9,activity:'CMC',status:'Closed',start:'2026-06-13 16:18',end:'2026-06-14 14:57',invoice:'51495409',date:'2026-06-13'},
 {visit:'2605082',vessel:'ASPIRE',loa:96.5,activity:'CMC',status:'Closed',start:'2026-06-14 04:42',end:'2026-06-14 17:00',invoice:'51495410',date:'2026-06-14'},
 {visit:'2605033',vessel:'MAERSK CABINDA',loa:249.12,activity:'CMC',status:'Closed',start:'2026-06-13 08:42',end:'2026-06-14 17:20',invoice:'51495411',date:'2026-06-13'},
 {visit:'2605009',vessel:'AL MURAYKH',loa:400,activity:'CMC',status:'Closed',start:'2026-06-12 21:52',end:'2026-06-14 17:50',invoice:'51495412',date:'2026-06-12'},
 {visit:'2605062',vessel:'WAHANA 39',loa:79.01,activity:'CMC',status:'Closed',start:'2026-06-13 08:48',end:'2026-06-14 17:16',invoice:'51495413',date:'2026-06-13'},
 {visit:'2605041',vessel:'IRENES REWARD',loa:185.97,activity:'CMC',status:'Closed',start:'2026-06-13 20:00',end:'2026-06-14 18:00',invoice:'51495414',date:'2026-06-13'},
 {visit:'2605106',vessel:'PG MARINE 47',loa:18,activity:'PILOTAGE',status:'Closed',start:'2026-06-14 16:36',end:'2026-06-14 17:45',invoice:'51495415',date:'2026-06-14'}
];