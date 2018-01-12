/* eslint-env mocha */
'use strict'

const loadFixture = require('aegir/fixtures')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const expect = chai.expect
chai.use(dirtyChai)
const CID = require('cids')
const IpldBitcoin = require('../src/index')

const fixtureBlockHex = loadFixture(__dirname, 'fixtures/block.hex')
const fixtureBlock = Buffer.from(fixtureBlockHex.toString(), 'hex')

describe('IPLD format resolver API resolve()', () => {
  it('should return the deserialized node if no path is given', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlock, (err, value) => {
      expect(err).to.not.exist()
      expect(value.remainderPath).is.empty()
      expect(value.value).is.not.empty()
      done()
    })
  })

  it('should return the deserialized node if the root is requested', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlock, '/', (err, value) => {
      expect(err).to.not.exist()
      expect(value.remainderPath).is.empty()
      expect(value.value).is.not.empty()
      done()
    })
  })

  it('should return the version', (done) => {
    verifyPath(fixtureBlock, '/version', 2, done)
  })

  it('should return the timestamp', (done) => {
    verifyPath(fixtureBlock, '/timestamp', 1386981279, done)
  })

  it('should return the difficulty', (done) => {
    verifyPath(fixtureBlock, '/difficulty', 419740270, done)
  })

  it('should return the nonce', (done) => {
    verifyPath(fixtureBlock, '/nonce', 3159344128, done)
  })

  it('should error on non-existent path', (done) => {
    verifyError(fixtureBlock, '/something/random', done)
  })

  it('should error on partially matching path that isn\'t a link', (done) => {
    verifyError(fixtureBlock, '/version/but/additional/things', done)
  })

  it('should return a link when parent is requested', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlock, '/parent', (err, value) => {
      expect(err).to.not.exist()
      expect(value.remainderPath).is.empty()
      expect(value.value).to.deep.equal({
        '/': new CID('z4HFzdHLxSgJvCMJrsDtV7MgqiGALZdbbxgcTLVUUXQGBkGYjLb')})
      done()
    })
  })

  it('should return a link and remaining path when parent is requested',
    (done) => {
      IpldBitcoin.resolver.resolve(fixtureBlock, '/parent/timestamp',
        (err, value) => {
          expect(err).to.not.exist()
          expect(value.remainderPath).to.equal('timestamp')
          expect(value.value).to.deep.equal({
            '/':
              new CID('z4HFzdHLxSgJvCMJrsDtV7MgqiGALZdbbxgcTLVUUXQGBkGYjLb')})
          done()
        })
    })

  it('should return a link when transactions are requested', (done) => {
    IpldBitcoin.resolver.resolve(fixtureBlock, '/tx/some/remainder',
      (err, value) => {
        expect(err).to.not.exist()
        expect(value.remainderPath).to.equal('some/remainder')
        expect(value.value).to.deep.equal({
          '/': new CID('z4HFzdHD15kVvtmVzeD7z9sisZ7acSC88wXS3KJGwGrnr2DwcVQ')})
        done()
      })
  })
})

const verifyPath = (block, path, expected, done) => {
  IpldBitcoin.resolver.resolve(block, path, (err, value) => {
    expect(err).to.not.exist()
    expect(value.remainderPath).is.empty()
    expect(value.value).is.equal(expected)
    done()
  })
}

const verifyError = (block, path, done) => {
  IpldBitcoin.resolver.resolve(block, path, (err, value) => {
    expect(value).to.not.exist()
    expect(err).to.be.an('error')
    done()
  })
}