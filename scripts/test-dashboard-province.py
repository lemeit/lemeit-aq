"""Entrada compatible: la vista PBA ahora se valida con el control Capas.
El listado territorial y su prueba de selección se retiraron por decisión
posterior a #41. Las 135 geometrías/nombres siguen en tests/province-map.test.mjs.
"""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('test-dashboard-layers.py')),run_name='__main__')
