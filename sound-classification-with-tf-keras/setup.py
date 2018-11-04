from setuptools import setup
from setuptools import find_packages

try:
    from pypandoc import convert
    read_md = lambda f: convert(f, 'rst')
except ImportError:
    print("warning: pypandoc module not found, could not convert Markdown to RST")
    read_md = lambda f: open(f, 'r').read()


setup(name='Panotti',
      version='1.0.0',
      description='Multi-Channel Audio Classifier',
      long_description=read_md('README.md'),
      author='Scott Hawley',
      author_email='sapyc@icloud.com',
      url='https://github.com/sap9433/sound-classification-with-tf-keras.git',
      download_url='https://github.com/sap9433/sound-classification-with-tf-keras.git',
      license='MIT',
      install_requires=['keras', 'librosa', 'h5py'],
      packages=find_packages()
) 
