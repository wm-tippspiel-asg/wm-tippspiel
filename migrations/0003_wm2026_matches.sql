-- WM 2026 Gruppenphase — alle 72 Spiele
-- Zeiten in UTC (CEST = UTC+2, also +2h für deutsche Zeit)

INSERT INTO matches (home_team, away_team, home_team_flag, away_team_flag, match_time, round, group_name, venue) VALUES

-- GRUPPE A
('Mexiko',     'Südafrika',  '🇲🇽','🇿🇦', '2026-06-11T19:00:00Z', 'group', 'A', 'Estadio Azteca, Mexiko-Stadt'),
('Südkorea',   'Tschechien', '🇰🇷','🇨🇿', '2026-06-12T02:00:00Z', 'group', 'A', 'Estadio Akron, Guadalajara'),
('Tschechien', 'Südafrika',  '🇨🇿','🇿🇦', '2026-06-18T16:00:00Z', 'group', 'A', 'Mercedes-Benz Stadium, Atlanta'),
('Mexiko',     'Südkorea',   '🇲🇽','🇰🇷', '2026-06-19T01:00:00Z', 'group', 'A', 'Estadio Akron, Guadalajara'),
('Tschechien', 'Mexiko',     '🇨🇿','🇲🇽', '2026-06-25T01:00:00Z', 'group', 'A', 'Estadio Azteca, Mexiko-Stadt'),
('Südafrika',  'Südkorea',   '🇿🇦','🇰🇷', '2026-06-25T01:00:00Z', 'group', 'A', 'Estadio BBVA, Monterrey'),

-- GRUPPE B
('Kanada',              'Bosnien-Herzegowina', '🇨🇦','🇧🇦', '2026-06-12T19:00:00Z', 'group', 'B', 'BMO Field, Toronto'),
('Katar',               'Schweiz',             '🇶🇦','🇨🇭', '2026-06-13T19:00:00Z', 'group', 'B', 'Levi''s Stadium, Santa Clara'),
('Schweiz',             'Bosnien-Herzegowina', '🇨🇭','🇧🇦', '2026-06-18T19:00:00Z', 'group', 'B', 'SoFi Stadium, Los Angeles'),
('Kanada',              'Katar',               '🇨🇦','🇶🇦', '2026-06-18T22:00:00Z', 'group', 'B', 'BC Place, Vancouver'),
('Schweiz',             'Kanada',              '🇨🇭','🇨🇦', '2026-06-24T19:00:00Z', 'group', 'B', 'BC Place, Vancouver'),
('Bosnien-Herzegowina', 'Katar',               '🇧🇦','🇶🇦', '2026-06-24T19:00:00Z', 'group', 'B', 'Lumen Field, Seattle'),

-- GRUPPE C
('Brasilien', 'Marokko',   '🇧🇷','🇲🇦', '2026-06-13T22:00:00Z', 'group', 'C', 'MetLife Stadium, New York'),
('Haiti',     'Schottland', '🇭🇹','🏴󠁧󠁢󠁳󠁣󠁴󠁿', '2026-06-14T01:00:00Z', 'group', 'C', 'Gillette Stadium, Boston'),
('Schottland','Marokko',   '🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇲🇦', '2026-06-19T22:00:00Z', 'group', 'C', 'Gillette Stadium, Boston'),
('Brasilien', 'Haiti',     '🇧🇷','🇭🇹', '2026-06-20T01:00:00Z', 'group', 'C', 'Lincoln Financial Field, Philadelphia'),
('Schottland','Brasilien', '🏴󠁧󠁢󠁳󠁣󠁴󠁿','🇧🇷', '2026-06-24T22:00:00Z', 'group', 'C', 'Hard Rock Stadium, Miami'),
('Marokko',   'Haiti',     '🇲🇦','🇭🇹', '2026-06-24T22:00:00Z', 'group', 'C', 'Mercedes-Benz Stadium, Atlanta'),

-- GRUPPE D
('USA',        'Paraguay',   '🇺🇸','🇵🇾', '2026-06-13T01:00:00Z', 'group', 'D', 'SoFi Stadium, Los Angeles'),
('Australien', 'Türkei',     '🇦🇺','🇹🇷', '2026-06-13T06:00:00Z', 'group', 'D', 'BC Place, Vancouver'),
('USA',        'Australien', '🇺🇸','🇦🇺', '2026-06-19T19:00:00Z', 'group', 'D', 'Lumen Field, Seattle'),
('Türkei',     'Paraguay',   '🇹🇷','🇵🇾', '2026-06-20T03:00:00Z', 'group', 'D', 'Levi''s Stadium, Santa Clara'),
('Türkei',     'USA',        '🇹🇷','🇺🇸', '2026-06-26T02:00:00Z', 'group', 'D', 'SoFi Stadium, Los Angeles'),
('Paraguay',   'Australien', '🇵🇾','🇦🇺', '2026-06-26T02:00:00Z', 'group', 'D', 'Levi''s Stadium, Santa Clara'),

-- GRUPPE E
('Deutschland',   'Curaçao',        '🇩🇪','🇨🇼', '2026-06-14T16:00:00Z', 'group', 'E', 'NRG Stadium, Houston'),
('Elfenbeinküste','Ecuador',        '🇨🇮','🇪🇨', '2026-06-14T23:00:00Z', 'group', 'E', 'Lincoln Financial Field, Philadelphia'),
('Deutschland',   'Elfenbeinküste', '🇩🇪','🇨🇮', '2026-06-20T20:00:00Z', 'group', 'E', 'BMO Field, Toronto'),
('Ecuador',       'Curaçao',        '🇪🇨','🇨🇼', '2026-06-20T23:00:00Z', 'group', 'E', 'Arrowhead Stadium, Kansas City'),
('Curaçao',       'Elfenbeinküste', '🇨🇼','🇨🇮', '2026-06-25T20:00:00Z', 'group', 'E', 'Lincoln Financial Field, Philadelphia'),
('Ecuador',       'Deutschland',    '🇪🇨','🇩🇪', '2026-06-25T20:00:00Z', 'group', 'E', 'MetLife Stadium, New York'),

-- GRUPPE F
('Niederlande', 'Japan',     '🇳🇱','🇯🇵', '2026-06-14T19:00:00Z', 'group', 'F', 'AT&T Stadium, Arlington'),
('Schweden',    'Tunesien',  '🇸🇪','🇹🇳', '2026-06-15T00:00:00Z', 'group', 'F', 'Estadio BBVA, Monterrey'),
('Niederlande', 'Schweden',  '🇳🇱','🇸🇪', '2026-06-20T16:00:00Z', 'group', 'F', 'NRG Stadium, Houston'),
('Tunesien',    'Japan',     '🇹🇳','🇯🇵', '2026-06-21T02:00:00Z', 'group', 'F', 'Estadio BBVA, Monterrey'),
('Japan',       'Schweden',  '🇯🇵','🇸🇪', '2026-06-25T22:00:00Z', 'group', 'F', 'AT&T Stadium, Arlington'),
('Tunesien',    'Niederlande','🇹🇳','🇳🇱', '2026-06-25T22:00:00Z', 'group', 'F', 'Arrowhead Stadium, Kansas City'),

-- GRUPPE G
('Belgien',   'Ägypten',   '🇧🇪','🇪🇬', '2026-06-15T19:00:00Z', 'group', 'G', 'Lumen Field, Seattle'),
('Iran',      'Neuseeland', '🇮🇷','🇳🇿', '2026-06-16T01:00:00Z', 'group', 'G', 'SoFi Stadium, Los Angeles'),
('Belgien',   'Iran',       '🇧🇪','🇮🇷', '2026-06-21T19:00:00Z', 'group', 'G', 'SoFi Stadium, Los Angeles'),
('Neuseeland','Ägypten',   '🇳🇿','🇪🇬', '2026-06-22T01:00:00Z', 'group', 'G', 'BC Place, Vancouver'),
('Ägypten',   'Iran',       '🇪🇬','🇮🇷', '2026-06-27T03:00:00Z', 'group', 'G', 'Lumen Field, Seattle'),
('Neuseeland','Belgien',    '🇳🇿','🇧🇪', '2026-06-27T03:00:00Z', 'group', 'G', 'BC Place, Vancouver'),

-- GRUPPE H
('Spanien',       'Kap Verde',   '🇪🇸','🇨🇻', '2026-06-15T16:00:00Z', 'group', 'H', 'Mercedes-Benz Stadium, Atlanta'),
('Saudi-Arabien', 'Uruguay',     '🇸🇦','🇺🇾', '2026-06-15T22:00:00Z', 'group', 'H', 'Hard Rock Stadium, Miami'),
('Spanien',       'Saudi-Arabien','🇪🇸','🇸🇦', '2026-06-21T16:00:00Z', 'group', 'H', 'Mercedes-Benz Stadium, Atlanta'),
('Uruguay',       'Kap Verde',   '🇺🇾','🇨🇻', '2026-06-21T22:00:00Z', 'group', 'H', 'Hard Rock Stadium, Miami'),
('Kap Verde',     'Saudi-Arabien','🇨🇻','🇸🇦', '2026-06-27T00:00:00Z', 'group', 'H', 'NRG Stadium, Houston'),
('Uruguay',       'Spanien',     '🇺🇾','🇪🇸', '2026-06-27T00:00:00Z', 'group', 'H', 'Estadio Akron, Guadalajara'),

-- GRUPPE I
('Frankreich', 'Senegal',  '🇫🇷','🇸🇳', '2026-06-16T19:00:00Z', 'group', 'I', 'MetLife Stadium, New York'),
('Irak',       'Norwegen', '🇮🇶','🇳🇴', '2026-06-16T22:00:00Z', 'group', 'I', 'Gillette Stadium, Boston'),
('Frankreich', 'Irak',     '🇫🇷','🇮🇶', '2026-06-22T21:00:00Z', 'group', 'I', 'Lincoln Financial Field, Philadelphia'),
('Norwegen',   'Senegal',  '🇳🇴','🇸🇳', '2026-06-23T00:00:00Z', 'group', 'I', 'MetLife Stadium, New York'),
('Norwegen',   'Frankreich','🇳🇴','🇫🇷', '2026-06-26T19:00:00Z', 'group', 'I', 'Gillette Stadium, Boston'),
('Senegal',    'Irak',     '🇸🇳','🇮🇶', '2026-06-26T19:00:00Z', 'group', 'I', 'BMO Field, Toronto'),

-- GRUPPE J
('Österreich',  'Jordanien',  '🇦🇹','🇯🇴', '2026-06-16T06:00:00Z', 'group', 'J', 'Levi''s Stadium, Santa Clara'),
('Argentinien', 'Algerien',   '🇦🇷','🇩🇿', '2026-06-17T01:00:00Z', 'group', 'J', 'Arrowhead Stadium, Kansas City'),
('Argentinien', 'Österreich', '🇦🇷','🇦🇹', '2026-06-22T17:00:00Z', 'group', 'J', 'AT&T Stadium, Arlington'),
('Jordanien',   'Algerien',   '🇯🇴','🇩🇿', '2026-06-23T03:00:00Z', 'group', 'J', 'Levi''s Stadium, Santa Clara'),
('Jordanien',   'Argentinien','🇯🇴','🇦🇷', '2026-06-28T02:00:00Z', 'group', 'J', 'AT&T Stadium, Arlington'),
('Algerien',    'Österreich', '🇩🇿','🇦🇹', '2026-06-28T02:00:00Z', 'group', 'J', 'Arrowhead Stadium, Kansas City'),

-- GRUPPE K
('Portugal',  'DR Kongo',  '🇵🇹','🇨🇩', '2026-06-17T17:00:00Z', 'group', 'K', 'NRG Stadium, Houston'),
('Usbekistan','Kolumbien', '🇺🇿','🇨🇴', '2026-06-18T03:00:00Z', 'group', 'K', 'Estadio Azteca, Mexiko-Stadt'),
('Portugal',  'Usbekistan','🇵🇹','🇺🇿', '2026-06-23T17:00:00Z', 'group', 'K', 'NRG Stadium, Houston'),
('Kolumbien', 'DR Kongo',  '🇨🇴','🇨🇩', '2026-06-24T03:00:00Z', 'group', 'K', 'Estadio Akron, Guadalajara'),
('Kolumbien', 'Portugal',  '🇨🇴','🇵🇹', '2026-06-27T23:30:00Z', 'group', 'K', 'Hard Rock Stadium, Miami'),
('DR Kongo',  'Usbekistan','🇨🇩','🇺🇿', '2026-06-27T23:30:00Z', 'group', 'K', 'Mercedes-Benz Stadium, Atlanta'),

-- GRUPPE L
('England',  'Kroatien', '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇭🇷', '2026-06-17T20:00:00Z', 'group', 'L', 'AT&T Stadium, Arlington'),
('Ghana',    'Panama',   '🇬🇭','🇵🇦', '2026-06-17T23:00:00Z', 'group', 'L', 'BMO Field, Toronto'),
('England',  'Ghana',    '🏴󠁧󠁢󠁥󠁮󠁧󠁿','🇬🇭', '2026-06-23T20:00:00Z', 'group', 'L', 'Gillette Stadium, Boston'),
('Panama',   'Kroatien', '🇵🇦','🇭🇷', '2026-06-23T23:00:00Z', 'group', 'L', 'BMO Field, Toronto'),
('Panama',   'England',  '🇵🇦','🏴󠁧󠁢󠁥󠁮󠁧󠁿', '2026-06-27T21:00:00Z', 'group', 'L', 'MetLife Stadium, New York'),
('Kroatien', 'Ghana',    '🇭🇷','🇬🇭', '2026-06-27T21:00:00Z', 'group', 'L', 'Lincoln Financial Field, Philadelphia');
