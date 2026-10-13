"""Fixture sintético, SQLite en memoria y requests bloqueado antes del import."""
import importlib.util
import os
import sqlite3
import sys
import types
from pathlib import Path

def blocked(*args, **kwargs):
    raise AssertionError('HTTP prohibido en auditoría offline')

sys.modules['requests'] = types.SimpleNamespace(get=blocked, post=blocked)
for key in ['PURPLEAIR_API_KEY', 'SENSOR_INDEXES', 'CF_ACCOUNT_ID', 'CF_DATABASE_ID', 'CF_API_TOKEN']:
    os.environ[key] = 'fixture-only'
spec = importlib.util.spec_from_file_location('ingest_fixture', 'ingest_purpleair.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
db = sqlite3.connect(':memory:')
db.execute('PRAGMA foreign_keys=ON')
db.executescript(Path('d1/schema.sql').read_text(encoding='utf-8'))
module.d1_query = lambda sql, params: db.execute(sql, params)
db.execute("INSERT INTO sensores(sensor_index,nombre) VALUES(101,'Nombre manual')")
module.upsert_sensor_metadata(101, 'Nombre API fixture', -35, -59)
assert db.execute('SELECT nombre FROM sensores').fetchone()[0] == 'Nombre API fixture'
fields = ['sensor_index', 'last_seen', 'pm2.5', 'temperature', 'humidity', 'pm2.5_a', 'pm2.5_b']
row = [101, 1791842400, 12.05, 68, 50, 10, 14]
module.insert_lectura(row, dict(zip(fields, range(len(fields)))))
assert db.execute('SELECT timestamp,pm2_5,temperatura,humedad,pm2_5_a,pm2_5_b FROM lecturas').fetchone() == ('2026-10-12 22:00:00', 12.05, 20, 50, 10, 14)
module.insert_lectura(row, dict(zip(fields, range(len(fields)))))
assert db.execute('SELECT COUNT(*) FROM lecturas').fetchone()[0] == 1
try:
    db.executescript(Path('d1/migration_004_airgradient.sql').read_text(encoding='utf-8'))
except sqlite3.OperationalError as error:
    assert 'duplicate column name' in str(error)
else:
    raise AssertionError('schema completo + migration_004 debería duplicar columna')
print('PASS: valores Python, dedupe, divergencia nombre y esquema/migración reproducidos sin HTTP')
db.execute("INSERT INTO sensores(sensor_index,nombre,proveedor,serial_externo) VALUES(900001,'AG','airgradient','fixture-AG')")
try:
    module.upsert_sensor_metadata(900001, 'PA collision', 0, 0)
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError('AQ-02: Python debe rechazar ID AirGradient antes de insertar lectura')
assert db.execute("SELECT proveedor FROM sensores WHERE sensor_index=900001").fetchone()[0] == 'airgradient'
print('PASS AQ-02: colisión Python rechazada sin cambiar identidad')
db.close()
