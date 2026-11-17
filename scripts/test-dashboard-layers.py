"""Entrada compatible de #43; la suite actual valida Visualización Leaflet.
La barra externa y su prueba se sustituyeron por decisión posterior.
"""
from pathlib import Path
import runpy
runpy.run_path(str(Path(__file__).with_name('test-dashboard-display.py')),run_name='__main__')
