import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

export default class Sticky extends Component {

  static propTypes = {
    topOffset: PropTypes.number,
    bottomOffset: PropTypes.number,
    position: PropTypes.oneOf(['top', 'bottom']),
    children: PropTypes.func.isRequired
  }

  static defaultProps = {
    position: 'top',
    topOffset: 0,
    bottomOffset: 0,
    disableCompensation: false,
    disableHardwareAcceleration: false
  }

  static contextTypes = {
    subscribe: PropTypes.func,
    unsubscribe: PropTypes.func,
    getParent: PropTypes.func
  }

  state = {
    isSticky: false,
    style: { }
  }

  componentWillMount() {
    if (!this.context.subscribe) throw new TypeError("Expected Sticky to be mounted within StickyContainer");

    this.context.subscribe(this.handleContainerEvent)
  }

  componentWillUnmount() {
    this.context.unsubscribe(this.handleContainerEvent)
  }

  componentDidUpdate() {
    this.placeholder.style.paddingBottom = this.props.disableCompensation ? 0 : `${this.state.isSticky ? this.state.calculatedHeight : 0}px`
  }

  handleContainerEvent = ({ distanceFromTop, distanceFromBottom, eventSource }) => {
    const parent = this.context.getParent();

    const placeholderClientRect = this.placeholder.getBoundingClientRect();
    const contentClientRect = this.content.getBoundingClientRect();
    const calculatedHeight = contentClientRect.height;

    let isSticky = false;

    const { position } = this.props;
    let top = 0;

    if (position === 'top') {
      isSticky = distanceFromTop <= -this.props.topOffset && distanceFromBottom > -this.props.bottomOffset;

      const bottomDifference = distanceFromBottom - this.props.bottomOffset - calculatedHeight;

      distanceFromBottom = distanceFromBottom - calculatedHeight;

      top = bottomDifference > 0 ? 0 : bottomDifference;
    } else if (position === 'bottom') {
      const viewportHeight = window.innerHeight;

      isSticky = distanceFromTop - this.props.topOffset <= viewportHeight && distanceFromBottom - this.props.bottomOffset > 0;

      top = Math.max(distanceFromTop - this.props.topOffset, viewportHeight - calculatedHeight);
      top = distanceFromBottom < viewportHeight ? distanceFromBottom - this.props.bottomOffset - calculatedHeight : top;
    }

    const style = !isSticky ? { } : {
      position: 'fixed',
      top: top,
      left: placeholderClientRect.left,
      width: placeholderClientRect.width
    };

    if (!this.props.disableHardwareAcceleration) {
      style.transform = 'translateZ(0)';
    }

    this.setState({
      isSticky,
      distanceFromTop,
      distanceFromBottom,
      calculatedHeight,
      style
    });
  };

  render() {
    const element = React.cloneElement(
      this.props.children({
        isSticky: this.state.isSticky,
        distanceFromTop: this.state.distanceFromTop,
        distanceFromBottom: this.state.distanceFromBottom,
        calculatedHeight: this.state.calculatedHeight,
        style: this.state.style
      }),
      { ref: content => { this.content = ReactDOM.findDOMNode(content); } }
    )

    return (
      <div>
        <div ref={ placeholder => this.placeholder = placeholder } />
        { element }
      </div>
    )
  }
}
